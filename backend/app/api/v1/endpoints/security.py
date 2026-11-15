from __future__ import annotations
import io
import time
import base64
import qrcode
import qrcode.image.svg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.core.auth_limits import check_limit
from app.core.config import settings
from app.core.security import verify_password
from app.services.two_factor_service import generate_secret, get_otp_uri, encrypt_secret, consume_code, TwoFactorServiceError

router = APIRouter(prefix="/security", tags=["security"])


@router.get("/2fa/health")
async def health_two_factor():
    return {"status": "ok", "issuer": settings.TWO_FACTOR_ISSUER, "window": settings.TWO_FACTOR_WINDOW}

class VerifyInput(BaseModel):
    code: str = Field(pattern=r"^[0-9]{6}$")

class DisableInput(VerifyInput):
    password: str

async def locked_user(db, user):
    return await db.scalar(select(User).where(User.id == user.id).with_for_update())

@router.post("/2fa/setup")
async def setup_two_factor(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    check_limit("2fa-setup:" + str(current_user.id))
    user = await locked_user(db, current_user)
    if user.is_two_factor_enabled:
        raise HTTPException(409, "Desative o 2FA antes de configurar novamente")
    secret = generate_secret()
    try:
        user.two_factor_secret = encrypt_secret(secret)
    except TwoFactorServiceError:
        raise HTTPException(503, "2FA indisponível: configure a chave de criptografia no backend") from None
    user.two_factor_setup_expires = time.time() + 600
    user.two_factor_last_step = None
    uri = get_otp_uri(secret, user.email)
    output = io.BytesIO()
    qrcode.make(uri, image_factory=qrcode.image.svg.SvgPathImage).save(output)
    await db.commit()
    return {"secret": secret, "otpauth_url": uri,
            "qr_svg": output.getvalue().decode(),
            "qr_code": "data:image/svg+xml;base64," + base64.b64encode(output.getvalue()).decode()}

@router.post("/2fa/verify")
async def verify_two_factor(payload: VerifyInput, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    check_limit("2fa-manage:" + str(current_user.id))
    user = await locked_user(db, current_user)
    if user.is_two_factor_enabled:
        raise HTTPException(409, "2FA já está ativo")
    if not user.two_factor_secret or not user.two_factor_setup_expires or user.two_factor_setup_expires <= time.time():
        raise HTTPException(400, "Configuração expirada. Gere outro QR Code.")
    if not consume_code(user, payload.code):
        raise HTTPException(400, "Código inválido, expirado ou já utilizado")
    user.is_two_factor_enabled = True
    user.two_factor_setup_expires = None
    await db.commit()
    return {"valid": True, "message": "2FA ativado"}

@router.post("/2fa/disable")
async def disable_two_factor(payload: DisableInput, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    check_limit("2fa-manage:" + str(current_user.id))
    user = await locked_user(db, current_user)
    if not user.is_two_factor_enabled or not verify_password(payload.password, user.password_hash) or not consume_code(user, payload.code):
        raise HTTPException(400, "Senha ou código inválido")
    user.is_two_factor_enabled = False
    user.two_factor_secret = None
    user.two_factor_last_step = None
    user.two_factor_challenge = None
    await db.commit()
    return {"message": "2FA desativado"}
