
from __future__ import annotations

import asyncio
import logging
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy import event

from app.core.database import AsyncSessionLocal
from app.models.push_device import PushDevice

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
PENDING_KEY = "pending_expo_push_notifications"


async def enviar_push(
    user_id: UUID,
    notification_id: UUID,
    title: str,
    message: str,
    notification_type: str,
    item_id: UUID | None = None,
):
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(PushDevice.expo_push_token).where(
                    PushDevice.user_id == user_id,
                    PushDevice.is_active.is_(True),
                )
            )

            tokens = list(dict.fromkeys(result.scalars().all()))

        if not tokens:
            return

        data = {
            "notification_id": str(notification_id),
            "type": str(notification_type),
        }

        if item_id:
            data["item_id"] = str(item_id)

        async with httpx.AsyncClient(timeout=15.0) as client:
            for inicio in range(0, len(tokens), 100):
                lote = tokens[inicio:inicio + 100]

                mensagens = [
                    {
                        "to": token,
                        "title": title,
                        "body": message,
                        "sound": "default",
                        "channelId": "default",
                        "data": data,
                    }
                    for token in lote
                ]

                response = await client.post(
                    EXPO_PUSH_URL,
                    json=mensagens,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()

                resultado = response.json()
                tickets = resultado.get("data", [])

                if isinstance(tickets, dict):
                    tickets = [tickets]

                tokens_invalidos = []

                for token, ticket in zip(lote, tickets):
                    if ticket.get("status") == "error":
                        logger.warning(
                            "Expo Push recusou notificação: %s",
                            ticket.get("message", "erro desconhecido"),
                        )

                        if (
                            ticket.get("details", {}).get("error")
                            == "DeviceNotRegistered"
                        ):
                            tokens_invalidos.append(token)

                if tokens_invalidos:
                    async with AsyncSessionLocal() as db:
                        result = await db.execute(
                            select(PushDevice).where(
                                PushDevice.expo_push_token.in_(
                                    tokens_invalidos
                                )
                            )
                        )

                        for device in result.scalars():
                            device.is_active = False

                        await db.commit()

                logger.info(
                    "Push enviado ao Expo para %s dispositivo(s).",
                    len(lote),
                )

    except Exception:
        logger.exception(
            "Falha ao enviar notificação push %s",
            notification_id,
        )


def agendar_push(
    db,
    user_id: UUID,
    notification_id: UUID,
    title: str,
    message: str,
    notification_type: str,
    item_id: UUID | None = None,
):
    pendentes = db.info.setdefault(PENDING_KEY, [])

    pendentes.append(
        {
            "user_id": user_id,
            "notification_id": notification_id,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "item_id": item_id,
        }
    )


@event.listens_for(Session, "after_commit")
def disparar_push_apos_commit(session):
    pendentes = session.info.pop(PENDING_KEY, [])

    if not pendentes:
        return

    try:
        loop = asyncio.get_running_loop()

        for payload in pendentes:
            loop.create_task(enviar_push(**payload))

    except RuntimeError:
        logger.warning(
            "Não há loop assíncrono para despachar notificações."
        )


@event.listens_for(Session, "after_rollback")
def descartar_push_apos_rollback(session):
    session.info.pop(PENDING_KEY, None)
