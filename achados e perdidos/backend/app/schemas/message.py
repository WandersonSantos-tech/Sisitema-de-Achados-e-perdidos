from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    """Schema para envio de mensagem"""
    content: str = Field(..., min_length=1, max_length=5000)
    receiver_id: uuid.UUID


class SenderInfo(BaseModel):
    """Informações básicas do remetente"""
    id: uuid.UUID
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class ReceiverInfo(BaseModel):
    """Informações básicas do destinatário"""
    id: uuid.UUID
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    """DTO para exibição de mensagem"""
    id: uuid.UUID
    item_id: uuid.UUID
    sender_id: uuid.UUID
    receiver_id: uuid.UUID
    content: str
    created_at: datetime
    sender: Optional[SenderInfo] = None
    receiver: Optional[ReceiverInfo] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    """DTO para histórico de conversa entre dois usuários"""
    item_id: uuid.UUID
    other_user: Optional[SenderInfo] = None
    messages: list[MessageResponse]

    model_config = ConfigDict(from_attributes=True)
