from __future__ import annotations

from typing import Optional

from fastapi import BackgroundTasks, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_password_reset_token,
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

    user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
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
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    token = create_password_reset_token(user.email)
    background_tasks.add_task(
        email_service.send_password_reset_email, user.email, token)


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    from app.core.security import verify_password_reset_token

    email = verify_password_reset_token(token)
    if not email:
        raise HTTPException(
            status_code=400, detail="Token inválido ou expirado")

    q = await db.execute(select(User).where(User.email == email))
    user = q.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.password_hash = hash_password(new_password)
    await db.commit()
    await db.refresh(user)
