
"""Fluxo interno de assinatura manuscrita do Onde Tá."""

import base64
import hashlib
import json
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select

from app.models.user import User
from app.core.logging_config import get_audit_logger
from app.services.termo_devolucao_pdf import gerar_termo_devolucao


def read_state(claim):
    try:
        state = json.loads(claim.signature or "{}")
        return state if isinstance(state, dict) else {}
    except (ValueError, TypeError):
        return {}


def public_state(state):
    return {
        key: state.get(key)
        for key in (
            "status",
            "signature_id",
            "created_at",
            "accepted_at",
            "signed_at",
            "rejected_at",
            "rejection_reason",
            "document_hash",
        )
    }


def _pdf_fields(state):
    return {
        "claim_id": state["claim_id"],
        "item_id": state["item_id"],
        "item_titulo": state["item_title"],
        "item_descricao": state["item_description"],
        "usuario_nome": state["signer_name"],
        "usuario_email": state["signer_email"],
        "funcionario_nome": state["staff_name"],
        "retirada_em": state["pickup_at"],
    }


async def create_signature(db, claim, item, staff):
    state = read_state(claim)

    if state and state.get("status") != "rejected":
        return public_state(state)

    if not claim.pickup_at:
        raise HTTPException(400, "Agende a retirada primeiro")

    signer = await db.scalar(
        select(User).where(User.id == claim.requester_id)
    )

    if not signer or not signer.is_active:
        raise HTTPException(409, "Solicitante indisponível")

    state = {
        "status": "pending",
        "signature_id": str(claim.id),
        "claim_id": str(claim.id),
        "item_id": str(item.id),
        "item_title": item.title,
        "item_description": item.description or "",
        "signer_id": str(signer.id),
        "signer_name": signer.name,
        "signer_email": signer.email,
        "staff_id": str(staff.id),
        "staff_name": staff.name,
        "pickup_at": claim.pickup_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    claim.signature = json.dumps(state, ensure_ascii=False)
    claim.responsible_id = staff.id
    await db.commit()

    get_audit_logger().log_event(
        "AUDIT_RETURN_PROPOSED",
        claim_id=str(claim.id),
        staff_id=str(staff.id),
    )

    return public_state(state)


async def refresh_signature(db, claim):
    state = read_state(claim)

    if not state:
        return {"status": "not_requested"}

    return public_state(state)


async def accept_signature(db, claim, user):
    state = read_state(claim)

    if claim.requester_id != user.id:
        raise HTTPException(403, "Acesso não autorizado")

    if claim.returned_at or state.get("status") != "pending":
        raise HTTPException(409, "Proposta indisponível")

    state["status"] = "accepted"
    state["accepted_at"] = datetime.now(
        timezone.utc
    ).isoformat()

    claim.signature = json.dumps(state, ensure_ascii=False)
    await db.commit()

    return public_state(state)


async def reject_signature(db, claim, user, reason):
    state = read_state(claim)

    if claim.requester_id != user.id:
        raise HTTPException(403, "Acesso não autorizado")

    if claim.returned_at or state.get("status") != "pending":
        raise HTTPException(409, "Proposta indisponível")

    state["status"] = "rejected"
    state["rejected_at"] = datetime.now(
        timezone.utc
    ).isoformat()
    state["rejection_reason"] = reason

    claim.signature = json.dumps(state, ensure_ascii=False)
    await db.commit()

    return public_state(state)


def preview_pdf(claim):
    state = read_state(claim)

    if state.get("status") not in (
        "pending",
        "accepted",
        "signed",
    ):
        raise HTTPException(409, "Termo indisponível")

    if state["status"] == "signed":
        return signed_pdf(claim)

    try:
        return gerar_termo_devolucao(
            **_pdf_fields(state)
        )
    except Exception:
        raise HTTPException(
            500,
            "Não foi possível gerar o termo",
        ) from None


async def sign_signature(db, claim, user, consent, image):
    state = read_state(claim)

    if claim.requester_id != user.id:
        raise HTTPException(403, "Acesso não autorizado")

    if claim.returned_at or state.get("status") != "accepted":
        raise HTTPException(
            409,
            "Aceite necessário antes da assinatura",
        )

    if consent is not True:
        raise HTTPException(
            400,
            "Confirme a concordância com o termo",
        )

    if not isinstance(image, str) or not image.startswith(
        "data:image/png;base64,"
    ):
        raise HTTPException(
            400,
            "Envie uma assinatura PNG válida",
        )

    if len(image) > 700000:
        raise HTTPException(
            413,
            "Imagem de assinatura muito grande",
        )

    try:
        raw_image = base64.b64decode(
            image.split(",", 1)[1],
            validate=True,
        )
    except (ValueError, base64.binascii.Error):
        raise HTTPException(400, "Assinatura inválida") from None

    if not raw_image.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(400, "Imagem não é PNG")

    signed_at = datetime.now(timezone.utc).isoformat()

    try:
        pdf_bytes = gerar_termo_devolucao(
            **_pdf_fields(state),
            assinatura_base64=image,
            assinado_em=signed_at,
        )
    except Exception:
        raise HTTPException(
            400,
            "Não foi possível incorporar a assinatura",
        ) from None

    state["status"] = "signed"
    state["signed_at"] = signed_at
    state["document_hash"] = hashlib.sha256(
        pdf_bytes
    ).hexdigest()
    state["pdf_base64"] = base64.b64encode(
        pdf_bytes
    ).decode("ascii")

    claim.signature = json.dumps(state, ensure_ascii=False)
    await db.commit()

    get_audit_logger().log_event(
        "AUDIT_RETURN_SIGNED",
        claim_id=str(claim.id),
        user_id=str(user.id),
        document_hash=state["document_hash"],
    )

    return public_state(state)


def signed_pdf(claim):
    state = read_state(claim)

    if state.get("status") != "signed":
        raise HTTPException(409, "Termo ainda não assinado")

    encoded = state.get("pdf_base64")

    if not encoded:
        raise HTTPException(409, "PDF indisponível")

    try:
        data = base64.b64decode(
            encoded,
            validate=True,
        )
    except (ValueError, base64.binascii.Error):
        raise HTTPException(
            409,
            "Documento armazenado inválido",
        ) from None

    if hashlib.sha256(data).hexdigest() != state.get(
        "document_hash"
    ):
        raise HTTPException(
            409,
            "Integridade do documento comprometida",
        )

    return data
