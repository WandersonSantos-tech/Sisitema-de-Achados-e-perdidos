from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.services.two_factor_service import (
    TwoFactorServiceError,
    generate_secret,
    get_otp_uri,
    verify_code,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/security", tags=["security"])


class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_url: str


class TwoFactorVerifyRequest(BaseModel):
    code: str


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_two_factor(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Cria o segredo e a URL para QR Code do usuário e persiste no banco."""
    try:
        secret = generate_secret()
        otpauth_url = get_otp_uri(secret, current_user.email)
        current_user.two_factor_secret = secret
        current_user.is_two_factor_enabled = True
        return TwoFactorSetupResponse(secret=secret, otpauth_url=otpauth_url)
    except TwoFactorServiceError as exc:
        logger.exception("two_factor_setup_failed", extra={
                         "context": {"user_id": str(current_user.id)}})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.post("/2fa/verify")
async def verify_two_factor(
    payload: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Valida o código TOTP informado pelo usuário."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não autenticado")

    secret = current_user.two_factor_secret
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA não configurado para este usuário. Gere o secret primeiro.",
        )

    valid = verify_code(secret, payload.code)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Código 2FA inválido ou expirado")

    current_user.is_two_factor_enabled = True
    return {"valid": True, "message": "Código 2FA validado com sucesso"}


@router.get("/2fa/health")
async def health_two_factor() -> Any:
    return {
        "status": "ok",
        "issuer": settings.TWO_FACTOR_ISSUER,
        "window": settings.TWO_FACTOR_WINDOW,
    }
