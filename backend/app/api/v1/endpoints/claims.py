from __future__ import annotations

import uuid
from typing import Annotated
from sqlalchemy import select
from app.models.claim import Claim
from app.models.item import Item

from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.schemas.claim import (
    ClaimCreate,
    ClaimDetailResponse,
    ClaimListResponse,
    ClaimResponse,
    ClaimStatusUpdate,
)
from app.services.claim_service import ClaimService, ModeratedItemError
from app.services.notification_service import NotificationService
from app.models.enums import NotificationType
from app.models.match_dispatch import MatchDispatch
from app.models.match_dispatch import MatchDispatch
from app.schemas.claim import ItemInfo
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/claims", tags=["claims"])


@router.post(
    "/items/{item_id}/claims",
    response_model=ClaimResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar reivindicação de item",
    responses={
        201: {"description": "Reivindicação criada com sucesso"},
        400: {"description": "Validação falhou ou usuário é dono do item"},
        404: {"description": "Item não encontrado"},
    },
)
async def create_claim(
    item_id: uuid.UUID,
    claim_in: ClaimCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ClaimResponse:
    """
    Cria uma nova reivindicação (claim) para um item.

    Validações:
    - Usuário não pode reivindicar seu próprio item
    - Item não pode estar DEVOLVIDO ou CANCELADO
    - Usuário não pode ter múltiplas reivindicações PENDENTES para o mesmo item

    Uma notificação é disparada para o proprietário do item informando a nova reivindicação.
    """
    try:
        claim = await ClaimService.create_claim(db, item_id, current_user, claim_in)

        # Disparar notificação para o dono do item
        from app.models.item import Item

        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        result = await db.execute(
            select(Item)
            .where(Item.id == item_id)
            .options(selectinload(Item.user))
        )
        item = result.scalar_one_or_none()

        if item:
            await NotificationService.create_notification(
                db,
                user_id=item.user_id,
                item_id=item_id,
                title="Nova Reivindicação Recebida",
                message=f"{current_user.name} abriu uma reivindicação para o item '{item.title}'",
                notification_type=NotificationType.CLAIM_RECEIVED,
            )

        await db.commit()
        return claim

    except PermissionError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get(
    "/items/{item_id}/claims",
    response_model=ClaimListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar reivindicações de um item",
    responses={
        200: {"description": "Lista de reivindicações retornada"},
        403: {"description": "Apenas proprietário do item ou admin podem consultar"},
        404: {"description": "Item não encontrado"},
    },
)
async def get_item_claims(
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> ClaimListResponse:
    """
    Lista todas as reivindicações de um item específico.

    Acesso restrito:
    - Apenas o proprietário do item pode consultar
    - Administradores podem consultar qualquer item
    """
    from app.models.item import Item

    from sqlalchemy import select

    # Verificar se item existe
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado"
        )

    # Validar permissões
    if current_user.id != item.user_id and current_user.role not in (UserRole.ADMIN, UserRole.COLABORADOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o proprietário do item ou administradores podem consultar reivindicações",
        )

    try:
        claims, total = await ClaimService.get_item_claims(
            db, item_id, page, page_size
        )

        return ClaimListResponse(
            items=[ClaimDetailResponse.model_validate(
                claim) for claim in claims],
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.patch(
    "/claims/{claim_id}/status",
    response_model=ClaimDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar status de reivindicação",
    responses={
        200: {"description": "Status atualizado com sucesso"},
        400: {"description": "Dados inválidos"},
        403: {"description": "Apenas proprietário do item ou admin podem aprovar"},
        404: {"description": "Reivindicação não encontrada"},
    },
)
async def update_claim_status(
    claim_id: uuid.UUID,
    status_in: ClaimStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ClaimDetailResponse:
    """
    Aprova ou rejeita uma reivindicação.

    Acesso restrito:
    - Apenas o proprietário do item pode atualizar
    - Administradores podem atualizar qualquer reivindicação

    Efeitos da aprovação:
    - Item transiciona para EM_NEGOCIACAO
    - Histórico de status é registrado
    - Notificação é enviada ao solicitante
    """
    try:
        claim = await ClaimService.update_claim_status(
            db, claim_id, current_user, status_in
        )
        await db.commit()
        return ClaimDetailResponse.model_validate(claim)

    except ModeratedItemError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except PermissionError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get(
    "/my-claims",
    response_model=ClaimListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar minhas reivindicações",
    responses={
        200: {"description": "Lista de reivindicações do usuário"},
    },
)

async def get_my_claims(
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> ClaimListResponse:
    try:
        claims, total = await ClaimService.get_user_claims(
            db, current_user.id, page, page_size
        )

        claim_item_ids = {claim.item_id for claim in claims}
        lost_by_found_id = {}

        if claim_item_ids:
            dispatches = (
                await db.scalars(
                    select(MatchDispatch)
                    .where(
                        MatchDispatch.found_item_id.in_(claim_item_ids),
                        MatchDispatch.recipient_id == current_user.id,
                    )
                    .order_by(MatchDispatch.created_at.desc())
                )
            ).all()

            for dispatch in dispatches:
                lost_by_found_id.setdefault(
                    dispatch.found_item_id,
                    dispatch.lost_item_id,
                )

        lost_items = {}

        if lost_by_found_id:
            result = await db.scalars(
                select(Item)
                .where(
                    Item.id.in_(set(lost_by_found_id.values())),
                    Item.user_id == current_user.id,
                )
                .options(selectinload(Item.images))
            )

            lost_items = {
                item.id: item
                for item in result.all()
            }

        response_items = []

        for claim in claims:
            response = ClaimDetailResponse.model_validate(claim)

            lost_id = lost_by_found_id.get(claim.item_id)
            lost_item = lost_items.get(lost_id)

            if lost_item is not None:
                response.lost_item = ItemInfo.model_validate(lost_item)

            response_items.append(response)

        return ClaimListResponse(
            items=response_items,
            total=total,
            page=page,
            page_size=page_size,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )



from datetime import datetime, timezone
from pydantic import BaseModel, Field, AwareDatetime
from app.api.deps import get_current_staff
from app.models.status_history import StatusHistory
from app.models.enums import ClaimStatus, ItemStatus

class PickupInput(BaseModel):
    pickup_at: AwareDatetime

class ReturnInput(BaseModel):
    signature: str | None = None  # Legacy clients cannot supply proof of signing.


async def return_claim(db, claim_id, staff):
    claim = await db.scalar(
        select(Claim)
        .where(Claim.id == claim_id)
        .with_for_update()
    )

    if claim is None:
        raise HTTPException(404, "Solicitação não encontrada")

    if claim.status == ClaimStatus.REJEITADA:
        raise HTTPException(409, "Solicitação rejeitada")

    if claim.returned_at:
        raise HTTPException(409, "Objeto já devolvido")

    item = await db.scalar(
        select(Item)
        .where(Item.id == claim.item_id)
        .with_for_update()
    )

    if item is None:
        raise HTTPException(404, "Objeto não encontrado")

    if item.status != ItemStatus.EM_NEGOCIACAO:
        raise HTTPException(
            409,
            "Abra a conversa para iniciar a negociação antes da retirada"
        )

    if claim.responsible_id and claim.responsible_id != staff.id:
        raise HTTPException(
            403,
            "Somente o funcionário responsável pode registrar a retirada"
        )

    return claim, item


@router.post("/claims/{claim_id}/start-negotiation")
async def start_negotiation(
    claim_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_staff),
):
    claim = await db.scalar(
        select(Claim)
        .where(Claim.id == claim_id)
        .with_for_update()
    )

    if claim is None:
        raise HTTPException(404, "Solicitação não encontrada")

    if claim.status == ClaimStatus.REJEITADA or claim.returned_at:
        raise HTTPException(409, "Solicitação indisponível")

    if claim.responsible_id and claim.responsible_id != staff.id:
        raise HTTPException(
            403,
            "Solicitação vinculada a outro funcionário"
        )

    item = await db.scalar(
        select(Item)
        .where(Item.id == claim.item_id)
        .with_for_update()
    )

    if item is None:
        raise HTTPException(404, "Objeto não encontrado")

    if item.status in (
        ItemStatus.DEVOLVIDO,
        ItemStatus.CANCELADO,
    ):
        raise HTTPException(409, "Objeto indisponível")

    if item.status == ItemStatus.PERDIDO:
        raise HTTPException(
            409,
            "O objeto ainda está registrado como perdido"
        )

    if item.status != ItemStatus.EM_NEGOCIACAO:
        previous_status = item.status
        item.status = ItemStatus.EM_NEGOCIACAO

        db.add(
            StatusHistory(
                item_id=item.id,
                changed_by=staff.id,
                previous_status=previous_status,
                new_status=ItemStatus.EM_NEGOCIACAO,
                note="Negociação iniciada ao abrir conversa",
            )
        )

    if claim.responsible_id is None:
        claim.responsible_id = staff.id

    await db.commit()

    return {
        "message": "Negociação iniciada",
        "status": item.status.value,
    }


@router.patch("/claims/{claim_id}/pickup", response_model=ClaimResponse)
async def schedule_pickup(claim_id: uuid.UUID, body: PickupInput,
                          db: AsyncSession = Depends(get_db), staff: User = Depends(get_current_staff)):
    claim, item = await return_claim(db, claim_id, staff)
    if body.pickup_at <= datetime.now(timezone.utc):
        raise HTTPException(400, "Escolha uma data futura")
    from app.services.return_signature_service import read_state
    if claim.signature and read_state(claim).get("status") != "rejected":
        raise HTTPException(409, "Proposta já enviada; agendamento não pode ser alterado")
    claim.pickup_at = body.pickup_at
    await db.commit()
    return claim

@router.post("/claims/{claim_id}/return", response_model=ClaimResponse)

async def complete_return(
    claim_id: uuid.UUID,
    body: ReturnInput = ReturnInput(),
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_staff),
):
    claim, item = await return_claim(db, claim_id, staff)

    if not claim.pickup_at:
        raise HTTPException(
            400, "Agende a retirada antes de confirmar"
        )

    from app.services.return_signature_service import refresh_signature

    state = await refresh_signature(db, claim)

    if state["status"] != "signed":
        raise HTTPException(
            409,
            "O solicitante ainda nao assinou o termo",
        )

    # Localizar o objeto perdido vinculado à correspondência
    # desta solicitação e pertencente ao solicitante.
    lost_item = await db.scalar(
        select(Item)
        .join(
            MatchDispatch,
            MatchDispatch.lost_item_id == Item.id,
        )
        .where(
            MatchDispatch.found_item_id == claim.item_id,
            MatchDispatch.recipient_id == claim.requester_id,
            Item.user_id == claim.requester_id,
            Item.type == "PERDIDO",
        )
        .order_by(MatchDispatch.created_at.desc())
        .limit(1)
        .with_for_update()
    )

    claim.returned_at = datetime.now(timezone.utc)

    # Atualizar o objeto encontrado do funcionário.
    db.add(
        StatusHistory(
            item_id=item.id,
            changed_by=staff.id,
            previous_status=item.status,
            new_status=ItemStatus.DEVOLVIDO,
            note=(
                f"Retirada da solicitação #{claim.id}; "
                "termo de devolução assinado eletronicamente "
                "com assinatura manuscrita"
            ),
        )
    )

    item.status = ItemStatus.DEVOLVIDO

    # Localiza o objeto perdido associado à correspondência
    lost_item_id = await db.scalar(
        select(MatchDispatch.lost_item_id)
        .where(
            MatchDispatch.found_item_id == item.id,
            MatchDispatch.recipient_id == claim.requester_id,
        )
        .limit(1)
    )

    if lost_item_id is not None:
        lost_item = await db.scalar(
            select(Item)
            .where(
                Item.id == lost_item_id,
                Item.user_id == claim.requester_id,
            )
            .with_for_update()
        )

        if lost_item is not None and lost_item.status != ItemStatus.DEVOLVIDO:
            db.add(
                StatusHistory(
                    item_id=lost_item.id,
                    changed_by=staff.id,
                    previous_status=lost_item.status,
                    new_status=ItemStatus.DEVOLVIDO,
                    note=f"Devolução concluída na solicitação #{claim.id}",
                )
            )

            lost_item.status = ItemStatus.DEVOLVIDO

    await db.commit()
    return claim

    # Atualizar também o objeto perdido do usuário.
    if lost_item is not None and lost_item.status != ItemStatus.DEVOLVIDO:
        db.add(
            StatusHistory(
                item_id=lost_item.id,
                changed_by=staff.id,
                previous_status=lost_item.status,
                new_status=ItemStatus.DEVOLVIDO,
                note=(
                    "Objeto perdido recuperado após a conclusão "
                    f"da devolução da solicitação #{claim.id}"
                ),
            )
        )

        lost_item.status = ItemStatus.DEVOLVIDO

    await db.commit()

    return claim


@router.post("/claims/{claim_id}/signature")
async def request_return_signature(claim_id: uuid.UUID, db: AsyncSession = Depends(get_db), staff: User = Depends(get_current_staff)):
    from app.services.return_signature_service import create_signature
    claim, item = await return_claim(db, claim_id, staff)
    if not claim.pickup_at:
        raise HTTPException(400, "Agende a retirada antes de solicitar assinatura")
    return await create_signature(db, claim, item, staff)


@router.get("/claims/{claim_id}/signature")
async def return_signature_status(claim_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.return_signature_service import refresh_signature
    claim = await db.scalar(select(Claim).where(Claim.id == claim_id).with_for_update())
    if not claim:
        raise HTTPException(404, "Solicitação não encontrada")
    if user.id not in (claim.requester_id, claim.responsible_id) and user.role != UserRole.ADMIN:
        raise HTTPException(403, "Acesso não autorizado")
    state = await refresh_signature(db, claim)
    await db.commit()
    return state

from fastapi.responses import Response
from pydantic import BaseModel as SignatureBaseModel
from pydantic import Field as SignatureField

from app.services.return_signature_service import (
    read_state as read_return_signature,
    accept_signature as accept_return_signature,
    reject_signature as reject_return_signature,
    sign_signature as sign_return_signature,
    preview_pdf as preview_return_pdf,
    signed_pdf as get_signed_return_pdf,
)


class ReturnRejectInput(SignatureBaseModel):
    reason: str = SignatureField(min_length=3, max_length=500)


class ReturnSignInput(SignatureBaseModel):
    consent: bool
    image: str = SignatureField(min_length=100, max_length=700000)


async def _signature_claim(db, claim_id, user):
    claim = await db.scalar(
        select(Claim)
        .where(Claim.id == claim_id)
        .with_for_update()
    )

    if not claim:
        raise HTTPException(404, "Solicitação não encontrada")

    if (
        user.id not in (
            claim.requester_id,
            claim.responsible_id,
        )
        and user.role != UserRole.ADMIN
    ):
        raise HTTPException(403, "Acesso não autorizado")

    return claim


@router.post("/claims/{claim_id}/signature/accept")
async def accept_return_document(
    claim_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    claim = await _signature_claim(db, claim_id, user)

    return await accept_return_signature(db, claim, user)


@router.post("/claims/{claim_id}/signature/reject")
async def reject_return_document(
    claim_id: uuid.UUID,
    body: ReturnRejectInput,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    claim = await _signature_claim(db, claim_id, user)

    return await reject_return_signature(
        db,
        claim,
        user,
        body.reason,
    )


@router.post("/claims/{claim_id}/signature/sign")
async def sign_return_document(
    claim_id: uuid.UUID,
    body: ReturnSignInput,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    claim = await _signature_claim(db, claim_id, user)

    return await sign_return_signature(
        db,
        claim,
        user,
        body.consent,
        body.image,
    )


@router.get("/claims/{claim_id}/signature/preview")
async def preview_return_document(
    claim_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    claim = await _signature_claim(db, claim_id, user)
    pdf = preview_return_pdf(claim)

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "inline",
            "Cache-Control": "no-store",
        },
    )


@router.get("/claims/{claim_id}/signature/pdf")
async def download_return_document(
    claim_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    claim = await _signature_claim(db, claim_id, user)
    pdf = get_signed_return_pdf(claim)

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'attachment; filename="devolucao-{claim_id}.pdf"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/signed-documents")
async def list_signed_return_documents(
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_staff),
):
    query = select(Claim).where(Claim.signature.is_not(None))

    if staff.role != UserRole.ADMIN:
        query = query.where(Claim.responsible_id == staff.id)

    claims = (await db.scalars(query)).all()

    documents = []

    for claim in claims:
        state = read_return_signature(claim)

        if state.get("status") != "signed":
            continue

        documents.append({
            "claim_id": str(claim.id),
            "item": state.get("item_title"),
            "signer": state.get("signer_name"),
            "signed_at": state.get("signed_at"),
            "document_hash": state.get("document_hash"),
            "returned_at": (
                claim.returned_at.isoformat()
                if claim.returned_at else None
            ),
        })

    return documents
