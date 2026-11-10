from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging_config import get_audit_logger

logger = logging.getLogger(__name__)
audit_logger = get_audit_logger()


class DsgnerServiceError(RuntimeError):
    """Erro de integração com a API do Dsgner."""


class DsgnerService:
    """Cliente assíncrono para a API de assinatura digital Dsgner."""

    def __init__(self) -> None:
        self.base_url = settings.DSGNER_API_BASE_URL.rstrip("/")
        self.api_key = settings.DSGNER_API_KEY
        self.timeout = settings.DSGNER_TIMEOUT_SECONDS

    def _headers(self) -> dict[str, str]:
        if not self.base_url or not self.api_key:
            raise DsgnerServiceError(
                "Configuração do Dsgner incompleta. Defina DSGNER_API_BASE_URL e DSGNER_API_KEY no .env."
            )
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def create_signature_request(
        self,
        *,
        document_name: str,
        signer_name: str,
        signer_email: str,
        document_content: str | None = None,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Dispara o envio de um documento para assinatura eletrônica."""
        try:
            payload: dict[str, Any] = {
                "document_name": document_name,
                "signer": {
                    "name": signer_name,
                    "email": signer_email,
                },
                "external_id": external_id or document_name,
                "metadata": metadata or {},
            }
            if document_content:
                payload["document_content"] = document_content

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}{settings.DSGNER_SIGNATURE_PATH}",
                    headers=self._headers(),
                    json=payload,
                )

            if response.is_error:
                raise DsgnerServiceError(
                    f"Dsgner respondeu com erro {response.status_code}: {response.text}"
                )

            data = response.json()
            audit_logger.log_event(
                "AUDIT_DSGNER_REQUEST_CREATED",
                level=logging.INFO,
                message="Solicitação de assinatura criada no Dsgner",
                document_name=document_name,
                signer_email=signer_email,
                external_id=payload["external_id"],
                response_status=response.status_code,
            )
            return data
        except Exception:
            logger.exception(
                "dsgner_signature_request_failed",
                extra={"context": {"document_name": document_name,
                                   "signer_email": signer_email}},
            )
            raise DsgnerServiceError(
                "Falha ao disparar a assinatura digital.") from None

    async def get_signature_status(self, signature_id: str) -> dict[str, Any]:
        """Consulta o status atual de um documento enviado para assinatura."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}{settings.DSGNER_STATUS_PATH.format(signature_id=signature_id)}",
                    headers=self._headers(),
                )

            if response.is_error:
                raise DsgnerServiceError(
                    f"Dsgner respondeu com erro {response.status_code}: {response.text}"
                )

            data = response.json()
            audit_logger.log_event(
                "AUDIT_DSGNER_STATUS_CHECKED",
                level=logging.INFO,
                message="Status de assinatura consultado no Dsgner",
                signature_id=signature_id,
                response_status=response.status_code,
            )
            return data
        except Exception:
            logger.exception(
                "dsgner_status_check_failed",
                extra={"context": {"signature_id": signature_id}},
            )
            raise DsgnerServiceError(
                "Falha ao consultar status da assinatura digital.") from None


dsgner_service = DsgnerService()
