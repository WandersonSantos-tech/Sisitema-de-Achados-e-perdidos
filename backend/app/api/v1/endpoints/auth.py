from __future__ import annotations

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.token import PasswordResetConfirm, PasswordResetRequest, Token
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services import auth_service
from app.core.auth_limits import check_limit
from app.services.two_factor_service import consume_code
from pydantic import BaseModel, Field
import jwt
import secrets
import hashlib
from datetime import datetime, timezone
from uuid import UUID

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    user = await auth_service.register_user(db, user_in)
    return UserResponse.model_validate(user)


@router.post("/login")
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)) -> Any:
    check_limit("login:" + (request.client.host if request.client else "unknown") + ":" + str(data.email), 10)
    user = await auth_service.authenticate(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    if user.is_two_factor_enabled:
        nonce = secrets.token_hex(32)
        user.two_factor_challenge = hashlib.sha256(nonce.encode()).hexdigest()
        challenge = jwt.encode({"sub": str(user.id), "scope": "2fa_login", "nonce": nonce,
                                "pwd": hashlib.sha256(user.password_hash.encode()).hexdigest(),
                                "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
                               settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        await db.commit()
        return {"requires_2fa": True, "challenge_token": challenge}

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.id,
        role=user.role.value if hasattr(
            user.role, "value") else str(user.role),
        expires_delta=access_token_expires,
    )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    req: PasswordResetRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Any:
    check_limit("reset-ip:" + (request.client.host if request.client else "unknown"), 10, 900)
    check_limit("reset-email:" + str(req.email).lower(), 3, 900)
    await auth_service.request_password_reset(db, req.email, background_tasks)
    return {"msg": "Se o e-mail existir, instruções foram enviadas."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(req: PasswordResetConfirm, db: AsyncSession = Depends(get_db)) -> Any:
    await auth_service.reset_password(db, req.token, req.new_password)
    return {"msg": "Senha redefinida com sucesso."}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> Any:
    return UserResponse.model_validate(current_user)


class TwoFactorLogin(BaseModel):
    challenge_token: str = Field(max_length=4096)
    code: str = Field(pattern=r"^[0-9]{6}$")


@router.post("/2fa/verify", response_model=Token)
async def complete_two_factor(data: TwoFactorLogin, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(data.challenge_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("scope") != "2fa_login":
            raise ValueError()
        user_id = UUID(payload["sub"])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(401, "Verificação expirada. Entre novamente.") from None
    check_limit("2fa-login:" + str(user_id))
    user = await db.scalar(select(User).where(User.id == user_id).with_for_update())
    if (not user or not user.is_active or not user.is_two_factor_enabled
            or user.two_factor_challenge != hashlib.sha256(payload.get("nonce", "").encode()).hexdigest()
            or payload.get("pwd") != hashlib.sha256(user.password_hash.encode()).hexdigest()):
        raise HTTPException(401, "Verificação inválida. Entre novamente.")
    if not consume_code(user, data.code):
        raise HTTPException(401, "Código inválido, expirado ou já utilizado")
    user.two_factor_challenge = None
    await db.commit()
    return {"access_token": create_access_token(str(user.id), user.role.value), "token_type": "bearer"}
