from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.message import (
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    SenderInfo,
)
from app.services.message_service import MessageService

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
        message = await MessageService.send_message(db, item_id, current_user, msg_in)
        await db.commit()
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
