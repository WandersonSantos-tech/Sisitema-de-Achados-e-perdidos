from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings


async def send_password_reset_email(to_email: str, token: str) -> None:
    msg = EmailMessage()

    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = "Redefinição de senha - Achados e Perdidos"

    # Rota correta definida no React Router
    reset_link = (
        f"http://localhost:5173/redefinir-senha?token={token}"
    )

    body = (
        "Você solicitou a redefinição de senha.\n\n"
        "Use o link abaixo para redefinir sua senha "
        "(válido por 15 minutos):\n\n"
        f"{reset_link}\n\n"
        "Se você não solicitou esta redefinição, ignore esta mensagem."
    )

    msg.set_content(body)

    smtp = aiosmtplib.SMTP(
        hostname=settings.SMTP_HOST,
        port=int(settings.SMTP_PORT),
    )

    try:
        await smtp.connect()
        await smtp.send_message(msg)
    finally:
        try:
            await smtp.quit()
        except Exception:
            pass