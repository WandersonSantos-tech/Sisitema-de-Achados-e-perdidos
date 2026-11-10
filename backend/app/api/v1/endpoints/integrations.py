from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.api.deps import get_current_admin, get_current_user
from app.models.user import User
from app.services.dsgner_service import DsgnerServiceError, dsgner_service
from app.services.email_service import BrevoEmailService, EmailDeliveryError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrations", tags=["integrations"])


class EmailSendRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str
    html_body: str | None = None


class SignatureRequestRequest(BaseModel):
    document_name: str
    signer_name: str
    signer_email: EmailStr
    document_content: str | None = None
    external_id: str | None = None


@router.post("/email/send")
async def send_email(
    payload: EmailSendRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    try:
        service = BrevoEmailService()
        result = await service.send_transactional_email(
            to_email=str(payload.to),
            subject=payload.subject,
            text_body=payload.body,
            html_body=payload.html_body,
        )
        return {"status": "sent", "message_id": result.get("messageId"), "user_id": str(current_user.id)}
    except EmailDeliveryError as exc:
        logger.exception("email_delivery_failed", extra={"context": {
                         "user_id": str(current_user.id), "to": str(payload.to)}})
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.post("/dsgner/send-signature")
async def send_signature_request(
    payload: SignatureRequestRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    try:
        result = await dsgner_service.create_signature_request(
            document_name=payload.document_name,
            signer_name=payload.signer_name,
            signer_email=str(payload.signer_email),
            document_content=payload.document_content,
            external_id=payload.external_id,
        )
        return {"status": "queued", "request": result, "user_id": str(current_user.id)}
    except DsgnerServiceError as exc:
        logger.exception(
            "dsgner_request_failed",
            extra={"context": {"user_id": str(
                current_user.id), "document_name": payload.document_name}},
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/dsgner/status/{signature_id}")
async def get_signature_status(
    signature_id: str,
    current_user: User = Depends(get_current_admin),
) -> Any:
    try:
        result = await dsgner_service.get_signature_status(signature_id)
        return {"status": "ok", "signature_id": signature_id, "data": result}
    except DsgnerServiceError as exc:
        logger.exception("dsgner_status_failed", extra={"context": {
                         "signature_id": signature_id, "user_id": str(current_user.id)}})
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
