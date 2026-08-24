from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings


async def send_password_reset_email(to_email: str, token: str) -> None:
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = "Redefinição de senha - Achados e Perdidos"

    reset_link = f"http://localhost:5173/reset-password?token={token}"
    body = (
        "Você solicitou a redefinição de senha.\n\n"
        f"Use o link abaixo para redefinir sua senha (válido por 15 minutos):\n{reset_link}\n\n"
        "Se você não solicitou, ignore esta mensagem."
    )

    msg.set_content(body)

    await aiosmtplib.send_message(
        msg,
        hostname=settings.SMTP_HOST,
        port=int(settings.SMTP_PORT),
    )
