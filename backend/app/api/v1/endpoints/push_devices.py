
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.push_device import PushDevice
from app.models.user import User


router = APIRouter(
    prefix="/push-devices",
    tags=["push-devices"],
)


class PushDeviceRequest(BaseModel):
    expo_push_token: str = Field(
        min_length=15,
        max_length=255,
    )
    platform: Literal["android"] = "android"


def validar_token(token: str) -> str:
    token = token.strip()

    if not (
        token.startswith("ExponentPushToken[")
        or token.startswith("ExpoPushToken[")
    ) or not token.endswith("]"):
        raise HTTPException(
            status_code=422,
            detail="Token Expo Push inválido.",
        )

    return token


@router.post("")
async def register_push_device(
    payload: PushDeviceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = validar_token(payload.expo_push_token)

    result = await db.execute(
        select(PushDevice).where(
            PushDevice.expo_push_token == token
        )
    )

    device = result.scalar_one_or_none()

    if device is None:
        device = PushDevice(
            user_id=current_user.id,
            expo_push_token=token,
            platform=payload.platform,
            is_active=True,
        )
        db.add(device)
    else:
        device.user_id = current_user.id
        device.platform = payload.platform
        device.is_active = True

    await db.commit()

    return {
        "success": True,
        "message": "Dispositivo registrado com sucesso.",
    }


@router.delete("")
async def unregister_push_device(
    payload: PushDeviceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = validar_token(payload.expo_push_token)

    result = await db.execute(
        select(PushDevice).where(
            PushDevice.expo_push_token == token,
            PushDevice.user_id == current_user.id,
        )
    )

    device = result.scalar_one_or_none()

    if device:
        await db.delete(device)
        await db.commit()

    return {
        "success": True,
        "message": "Dispositivo desvinculado com sucesso.",
    }
