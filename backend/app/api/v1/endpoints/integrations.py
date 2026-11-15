from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user

router = APIRouter(prefix="/integrations", tags=["integrations"])

@router.post("/email/send")
async def send_email(user=Depends(get_current_user)):
    raise HTTPException(410, "Envio de e-mail disponível exclusivamente na recuperação de senha")

@router.post("/dsgner/send-signature")
async def send_signature_request(user=Depends(get_current_user)):
    raise HTTPException(410, "Use o fluxo de assinatura da devolução")

@router.get("/dsgner/status/{signature_id}")
async def get_signature_status(signature_id: str, user=Depends(get_current_user)):
    raise HTTPException(410, "Consulte a assinatura pela solicitação de devolução")
