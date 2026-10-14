from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    """DTO para resposta de notificações"""
    id: uuid.UUID
    user_id: uuid.UUID
    item_id: uuid.UUID | None
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    """DTO para criação de notificações"""
    user_id: uuid.UUID
    item_id: uuid.UUID
    title: str
    message: str
    type: str


class MarkAsReadRequest(BaseModel):
    """DTO para marcar notificação como lida"""
    pass


class NotificationListResponse(BaseModel):
    """DTO para lista de notificações com paginação"""
    total: int
    page: int
    page_size: int
    items: list[NotificationResponse]
