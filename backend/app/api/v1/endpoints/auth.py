
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID
import hashlib
import hmac
import secrets

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.auth_limits import check_limit
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.token import PasswordResetConfirm, PasswordResetRequest, Token
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services import auth_service
from app.services.email_service import BrevoEmailService, EmailDeliveryError

router = APIRouter(prefix="/auth", tags=["auth"])

CODE_EXPIRATION_MINUTES = 5


def role_name(user: User) -> str:
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def code_digest(user_id: str, nonce: str, code: str) -> str:
    message = f"{user_id}:{nonce}:{code}".encode("utf-8")
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()


class LoginRequest(UserLogin):
    access_mode: str = Field(default="USER", pattern=r"^(USER|STAFF)$")


class TwoFactorLogin(BaseModel):
    challenge_token: str = Field(max_length=4096)
    code: str = Field(pattern=r"^[0-9]{6}$")


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    user = await auth_service.register_user(db, user_in)
    return UserResponse.model_validate(user)


@router.post("/login")
async def login(
    data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    client_ip = request.client.host if request.client else "unknown"

    check_limit(
        f"login:{client_ip}:{str(data.email).lower()}",
        10,
    )

    user = await auth_service.authenticate(
        db,
        data.email,
        data.password,
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Credenciais inválidas.",
        )

    role = role_name(user)

    if data.access_mode == "USER" and role != "USER":
        raise HTTPException(
            status_code=403,
            detail='Esta conta pertence à área administrativa. Utilize "Sou funcionário".',
        )

    if data.access_mode == "STAFF" and role not in ("ADMIN", "COLABORADOR"):
        raise HTTPException(
            status_code=403,
            detail="Esta conta não possui acesso à área operacional.",
        )

    check_limit(f"2fa-send:{user.id}", 3, 900)

    code = f"{secrets.randbelow(1000000):06d}"
    nonce = secrets.token_hex(32)

    challenge = jwt.encode(
        {
            "sub": str(user.id),
            "scope": "2fa_email_login",
            "nonce": nonce,
            "pwd": hashlib.sha256(
                user.password_hash.encode()
            ).hexdigest(),
            "mode": data.access_mode,
            "exp": datetime.now(timezone.utc)
            + timedelta(minutes=CODE_EXPIRATION_MINUTES),
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    user.two_factor_challenge = code_digest(
        str(user.id),
        nonce,
        code,
    )

    email_text = (
        "Olá!\n\n"
        "Recebemos uma tentativa de acesso à sua conta Onde Tá.\n\n"
        f"Seu código de verificação é: {code}\n\n"
        "O código é válido por 5 minutos e pode ser usado uma única vez.\n\n"
        "Se você não tentou entrar, ignore este e-mail.\n\n"
        "Equipe Onde Tá"
    )

    email_html = (
        '<div style="font-family:Arial,sans-serif;'
        'max-width:520px;margin:auto;padding:24px">'
        '<h2 style="color:#153769">Onde Tá</h2>'
        '<p>Recebemos uma tentativa de acesso à sua conta.</p>'
        '<p>Digite o código abaixo para continuar:</p>'
        f'<h1 style="letter-spacing:8px;color:#2056a6">{code}</h1>'
        '<p>Este código expira em <strong>5 minutos</strong> '
        'e só pode ser utilizado uma vez.</p>'
        '<p>Se não foi você, ignore esta mensagem.</p>'
        '</div>'
    )

    try:
        await BrevoEmailService().send_transactional_email(
            to_email=str(user.email),
            subject="Código de acesso - Onde Tá",
            text_body=email_text,
            html_body=email_html,
        )
        await db.commit()
    except EmailDeliveryError:
        await db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Não foi possível enviar o código. Tente novamente.",
        ) from None
    except Exception:
        await db.rollback()
        raise

    return {
        "requires_2fa": True,
        "challenge_token": challenge,
        "message": "Enviamos um código de seis dígitos para seu e-mail.",
        "expires_in": 300,
    }


@router.post("/2fa/verify", response_model=Token)
async def complete_two_factor(
    data: TwoFactorLogin,
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = jwt.decode(
            data.challenge_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        if payload.get("scope") != "2fa_email_login":
            raise ValueError()

        user_id = UUID(payload["sub"])
        nonce = payload["nonce"]

    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(
            status_code=401,
            detail="Verificação expirada. Entre novamente.",
        ) from None

    check_limit(f"2fa-login:{user_id}", 5, 900)

    user = await db.scalar(
        select(User)
        .where(User.id == user_id)
        .with_for_update()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Conta inválida ou desativada.",
        )

    if payload.get("pwd") != hashlib.sha256(
        user.password_hash.encode()
    ).hexdigest():
        raise HTTPException(
            status_code=401,
            detail="A senha foi alterada. Entre novamente.",
        )

    role = role_name(user)
    mode = payload.get("mode")

    if mode == "USER" and role != "USER":
        raise HTTPException(403, "Acesso não permitido.")

    if mode == "STAFF" and role not in ("ADMIN", "COLABORADOR"):
        raise HTTPException(403, "Acesso não permitido.")

    expected = code_digest(
        str(user.id),
        nonce,
        data.code,
    )

    if (
        not user.two_factor_challenge
        or not hmac.compare_digest(
            user.two_factor_challenge,
            expected,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Código inválido, expirado ou já utilizado.",
        )

    user.two_factor_challenge = None
    await db.commit()

    token = create_access_token(
        subject=user.id,
        role=role,
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/forgot-password", status_code=200)
async def forgot_password(
    req: PasswordResetRequest,
    request: Request,
    background_tasks: __import__("fastapi").BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Any:
    client_ip = request.client.host if request.client else "unknown"

    check_limit(f"reset-ip:{client_ip}", 10, 900)
    check_limit(f"reset-email:{str(req.email).lower()}", 3, 900)

    await auth_service.request_password_reset(
        db,
        req.email,
        background_tasks,
    )

    return {
        "msg": "Se o e-mail existir, instruções foram enviadas."
    }


@router.post("/reset-password", status_code=200)
async def reset_password(
    req: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
) -> Any:
    await auth_service.reset_password(
        db,
        req.token,
        req.new_password,
    )

    return {"msg": "Senha redefinida com sucesso."}


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: User = Depends(get_current_user),
) -> Any:
    return UserResponse.model_validate(current_user)
