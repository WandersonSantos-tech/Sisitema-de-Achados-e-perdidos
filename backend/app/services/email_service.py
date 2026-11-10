from __future__ import annotations

import logging
from email.message import EmailMessage
from typing import Any

import aiosmtplib
import httpx

from app.core.config import settings
from app.core.logging_config import get_audit_logger

logger = logging.getLogger(__name__)
audit_logger = get_audit_logger()


class EmailDeliveryError(RuntimeError):
    """Erro ao entregar e-mail via SMTP ou API externa."""


class BrevoEmailService:
    """Cliente de envio de e-mails transacionais usando API Brevo."""

    def __init__(self) -> None:
        self.api_key = settings.BREVO_API_KEY
        self.api_url = settings.BREVO_API_URL.rstrip("/")
        self.sender_email = settings.BREVO_SENDER_EMAIL
        self.sender_name = settings.BREVO_SENDER_NAME

    async def send_transactional_email(
        self,
        *,
        to_email: str,
        subject: str,
        text_body: str,
        html_body: str | None = None,
        reply_to: str | None = None,
    ) -> dict[str, Any]:
        """Envia e-mail transacional via Brevo API ou fallback SMTP."""
        if self.api_key:
            payload = {
                "sender": {
                    "name": self.sender_name,
                    "email": str(self.sender_email),
                },
                "to": [{"email": to_email}],
                "subject": subject,
                "textContent": text_body,
                "htmlContent": html_body or f"<p>{text_body}</p>",
            }
            if reply_to:
                payload["replyTo"] = {"email": reply_to}

            try:
                async with httpx.AsyncClient(timeout=settings.SMTP_TIMEOUT_SECONDS) as client:
                    response = await client.post(
                        f"{self.api_url}/smtp/email",
                        headers={
                            "api-key": self.api_key,
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                        },
                        json=payload,
                    )

                if response.is_error:
                    raise EmailDeliveryError(
                        f"Brevo API respondeu com erro {response.status_code}: {response.text}"
                    )

                result = response.json()
                audit_logger.log_event(
                    "AUDIT_EMAIL_SENT",
                    level=logging.INFO,
                    message="E-mail transacional enviado via Brevo API",
                    recipient=to_email,
                    subject=subject,
                    message_id=result.get("messageId"),
                )
                return result
            except Exception:
                logger.exception(
                    "brevo_email_failover",
                    extra={"context": {"recipient": to_email, "subject": subject}},
                )

        return await self.send_via_smtp(
            to_email=to_email,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
            reply_to=reply_to,
        )

    async def send_via_smtp(
        self,
        *,
        to_email: str,
        subject: str,
        text_body: str,
        html_body: str | None = None,
        reply_to: str | None = None,
    ) -> dict[str, Any]:
        """Fallback seguro por SMTP."""
        msg = EmailMessage()
        msg["From"] = str(settings.SMTP_FROM_EMAIL)
        msg["To"] = to_email
        msg["Subject"] = subject
        if reply_to:
            msg["Reply-To"] = reply_to

        msg.set_content(text_body)
        if html_body:
            msg.add_alternative(html_body, subtype="html")

        smtp = aiosmtplib.SMTP(
            hostname=settings.SMTP_HOST,
            port=int(settings.SMTP_PORT),
            use_tls=bool(settings.SMTP_USE_TLS),
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            timeout=settings.SMTP_TIMEOUT_SECONDS,
        )

        try:
            await smtp.connect()
            await smtp.send_message(msg)
            audit_logger.log_event(
                "AUDIT_EMAIL_SENT",
                level=logging.INFO,
                message="E-mail transacional enviado via SMTP",
                recipient=to_email,
                subject=subject,
            )
            return {"status": "sent_via_smtp", "recipient": to_email}
        except Exception as exc:
            logger.exception(
                "smtp_email_delivery_failed",
                extra={"context": {"recipient": to_email, "subject": subject}},
            )
            raise EmailDeliveryError(
                f"Falha no envio de e-mail: {exc}") from exc
        finally:
            try:
                await smtp.quit()
            except Exception:
                pass


async def send_password_reset_email(to_email: str, token: str) -> None:
    """Compatibilidade com o fluxo atual de reset de senha."""
    reset_link = f"http://localhost:5173/redefinir-senha?token={token}"
    text = (
        "Você solicitou a redefinição de senha.\n\n"
        "Use o link abaixo para redefinir sua senha (válido por 15 minutos):\n\n"
        f"{reset_link}\n\n"
        "Se você não solicitou esta redefinição, ignore esta mensagem."
    )
    service = BrevoEmailService()
    await service.send_transactional_email(
        to_email=to_email,
        subject="Redefinição de senha - Achados e Perdidos",
        text_body=text,
        html_body=f"<p>{text.replace(chr(10), '<br>')}</p>",
    )
