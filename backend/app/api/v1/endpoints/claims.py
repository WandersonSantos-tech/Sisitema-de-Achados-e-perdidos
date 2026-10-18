from __future__ import annotations

import uuid
from typing import Annotated
from sqlalchemy import select
from app.models.claim import Claim
from app.models.item import Item

from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    """
    Lista todas as reivindicações abertas pelo usuário logado.
    """
    try:
        claims, total = await ClaimService.get_user_claims(
            db, current_user.id, page, page_size
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


from datetime import datetime, timezone
from pydantic import BaseModel, Field, AwareDatetime
from app.api.deps import get_current_staff
from app.models.status_history import StatusHistory
from app.models.enums import ClaimStatus, ItemStatus

class PickupInput(BaseModel):
    pickup_at: AwareDatetime

class ReturnInput(BaseModel):
    signature: str = Field(min_length=100, max_length=300000)


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
    claim.pickup_at = body.pickup_at
    await db.commit()
    return claim

@router.post("/claims/{claim_id}/return", response_model=ClaimResponse)
async def complete_return(claim_id: uuid.UUID, body: ReturnInput,
                          db: AsyncSession = Depends(get_db), staff: User = Depends(get_current_staff)):
    claim, item = await return_claim(db, claim_id, staff)
    if not claim.pickup_at:
        raise HTTPException(400, "Agende a retirada antes de confirmar")
    if not body.signature.startswith("data:image/png;base64,"):
        raise HTTPException(400, "Assinatura de simulação inválida")
    claim.signature = body.signature
    claim.returned_at = datetime.now(timezone.utc)
    db.add(StatusHistory(item_id=item.id, changed_by=staff.id, previous_status=item.status,
                         new_status=ItemStatus.DEVOLVIDO, note=f"Retirada da solicitação #{claim.id}; assinatura simulada"))
    item.status = ItemStatus.DEVOLVIDO
    await db.commit()
    return claim
