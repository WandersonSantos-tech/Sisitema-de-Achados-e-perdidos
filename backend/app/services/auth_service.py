from __future__ import annotations

from typing import Optional
import secrets
import hashlib
import time
import logging

from fastapi import BackgroundTasks, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    hash_password,
    verify_password,
)
from app.models.user import User
from app.services import email_service


async def register_user(db: AsyncSession, user_in) -> User:
    q = await db.execute(select(User).where(User.email == user_in.email))
    existing = q.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    cpf_existente = await db.execute(select(User).where(User.cpf == user_in.cpf))
    if cpf_existente.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="CPF já cadastrado"
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        cpf=user_in.cpf,
        cpf_provisorio=False,
        password_hash=hash_password(user_in.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> Optional[User]:
    q = await db.execute(select(User).where(User.email == email))
    user = q.scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user


async def request_password_reset(db: AsyncSession, email: str, background_tasks: BackgroundTasks) -> None:
    q = await db.execute(select(User).where(User.email == email))
    user = q.scalar_one_or_none()
    if not user or not user.is_active:
        logging.getLogger(__name__).warning(
            "password_reset_user_not_found_or_inactive"
        )
        return
    token = secrets.token_urlsafe(32)
    user.password_reset_digest = hashlib.sha256(token.encode()).hexdigest()
    user.password_reset_expires = time.time() + 900
    await db.commit()
    background_tasks.add_task(
        _deliver_reset, user.email, token)
    logging.getLogger(__name__).warning(
    "password_reset_email_scheduled"
)


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    digest = hashlib.sha256(token.encode()).hexdigest()
    user = await db.scalar(select(User).where(User.password_reset_digest == digest).with_for_update())
    if not user or not user.is_active or not user.password_reset_expires or user.password_reset_expires <= time.time():
        raise HTTPException(400, "Token inválido ou expirado")
    user.password_reset_digest = None
    user.password_reset_expires = None
    user.password_hash = hash_password(new_password)
    await db.commit()
    await db.refresh(user)



async def _deliver_reset(email, token):
    logger = logging.getLogger(__name__)

    logger.warning("PASSWORD_RESET: iniciando envio")

    try:
        await email_service.send_password_reset_email(email, token)
        logger.warning("PASSWORD_RESET: servico de email finalizou")
    except Exception:
        logger.exception("PASSWORD_RESET: erro durante envio")