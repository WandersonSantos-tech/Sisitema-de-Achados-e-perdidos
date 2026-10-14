from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.claim import Claim
from app.models.enums import UserRole
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.message import (
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    SenderInfo,
)
from app.services.message_service import MessageService
from app.models.status_history import StatusHistory
from app.models.enums import ItemStatus

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post(
    "/items/{item_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enviar mensagem",
    responses={
        201: {"description": "Mensagem enviada com sucesso"},
        400: {"description": "Usuário não está envolvido com o item"},
        404: {"description": "Item ou usuário destinatário não encontrado"},
    },
)
async def send_message(
    item_id: uuid.UUID,
    msg_in: MessageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """
    Envia uma mensagem interna vinculada a um item para outro usuário.

    Validações de acesso:
    - Remetente deve ser o dono do item OU possuir uma reivindicação ativa
    - Destinatário também deve estar envolvido com o item

    Uma notificação é disparada para o destinatário informando a nova mensagem.
    """
    try:
        message = await MessageService.send_message(
            db, item_id, current_user, msg_in
        )

        await db.commit()

        await db.refresh(
            message,
            attribute_names=["sender", "receiver"]
        )

        return MessageResponse.model_validate(message)

    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except PermissionError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get(
    "/items/{item_id}/messages",
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Recuperar histórico de conversa",
    responses={
        200: {"description": "Histórico de mensagens retornado"},
        400: {"description": "Usuário não está envolvido com o item"},
        404: {"description": "Item ou outro usuário não encontrado"},
    },
)
async def get_conversation(
    item_id: uuid.UUID,
    interlocutor_id: Annotated[uuid.UUID, Query(description="ID do outro usuário na conversa")],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConversationResponse:
    """
    Recupera o histórico de mensagens entre o usuário logado e outro usuário para um item específico.

    A conversa é filtrada para mostrar apenas mensagens trocadas entre eles dois sobre aquele item.
    As mensagens são ordenadas cronologicamente (mais antigas primeiro).

    Validações:
    - Usuário logado deve estar envolvido com o item
    - Outro usuário também deve estar envolvido com o item
    """
    try:
        other_user, messages = await MessageService.get_conversation_with_user(
            db, item_id, current_user, interlocutor_id
        )
        for message in messages:
            await db.refresh(
                message,
                attribute_names=["sender", "receiver"]
            )

        if not other_user:
            raise ValueError(f"Usuário {interlocutor_id} não encontrado")

        return ConversationResponse(
            item_id=item_id,
            other_user=SenderInfo.model_validate(other_user),
            messages=[MessageResponse.model_validate(msg) for msg in messages],
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )

@router.get("/claims/{claim_id}/contact")
async def get_claim_contact(
    claim_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Claim).where(
            Claim.id == claim_id,
            Claim.requester_id == current_user.id,
        )
    )

    claim = result.scalar_one_or_none()

    if claim is None:
        raise HTTPException(
            status_code=404,
            detail="Solicitação não encontrada",
        )

    consulta = (
        select(User)
        .join(
            StatusHistory,
            StatusHistory.changed_by == User.id
        )
        .where(
            StatusHistory.item_id == claim.item_id,
            StatusHistory.new_status == ItemStatus.EM_NEGOCIACAO,
            StatusHistory.note == f"Reivindicação #{claim.id} aprovada",
            User.role == UserRole.ADMIN,
        )
        .order_by(StatusHistory.created_at.desc())
        .limit(1)
    )

    resultado_funcionario = await db.execute(consulta)
    funcionario = resultado_funcionario.scalar_one_or_none()


    if funcionario is None:
        raise HTTPException(
            status_code=404,
            detail="Não foi possível identificar o administrador responsável pela aprovação",
        )

    return {
        "id": str(funcionario.id),
        "name": funcionario.name,
    }
