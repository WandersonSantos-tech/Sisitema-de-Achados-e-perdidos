from __future__ import annotations

import logging

import pyotp

from app.core.config import settings
from app.core.logging_config import get_audit_logger

logger = logging.getLogger(__name__)
audit_logger = get_audit_logger()


class TwoFactorServiceError(ValueError):
    """Erro de validação do 2FA."""


def generate_secret() -> str:
    """Gera um secret seguro para TOTP."""
    secret = pyotp.random_base32()
    logger.info("two_factor_secret_generated", extra={
                "context": {"issuer": settings.TWO_FACTOR_ISSUER}})
    return secret


def get_otp_uri(secret: str, user_email: str) -> str:
    """Cria a URI de provisioning para QR Code."""
    if not secret:
        raise TwoFactorServiceError("Secret do 2FA não informado.")

    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(
        name=user_email,
        issuer_name=settings.TWO_FACTOR_ISSUER,
    )
    logger.info(
        "two_factor_uri_created",
        extra={"context": {"issuer": settings.TWO_FACTOR_ISSUER,
                           "user_email": user_email}},
    )
    return uri


def verify_code(secret: str, code: str) -> bool:
    """Valida um código TOTP de 6 dígitos."""
    if not secret:
        raise TwoFactorServiceError(
            "Secret do 2FA não configurado para o usuário.")

    code = str(code or "").strip()
    if len(code) != 6 or not code.isdigit():
        audit_logger.log_event(
            "AUDIT_2FA_VALIDATION_FAILED",
            level=logging.WARNING,
            message="Tentativa de validação 2FA com código inválido",
            code_length=len(code),
        )
        return False

    try:
        valid = pyotp.TOTP(secret, digits=6, interval=30).verify(
            code,
            valid_window=settings.TWO_FACTOR_WINDOW,
        )
    except Exception:
        logger.exception(
            "two_factor_validation_error",
            extra={"context": {"issuer": settings.TWO_FACTOR_ISSUER}},
        )
        return False

    if valid:
        audit_logger.log_event(
            "AUDIT_2FA_VALIDATION_SUCCESS",
            level=logging.INFO,
            message="Código 2FA validado com sucesso",
        )
    else:
        audit_logger.log_event(
            "AUDIT_2FA_VALIDATION_FAILED",
            level=logging.WARNING,
            message="Código 2FA inválido ou expirado",
        )

    return valid
