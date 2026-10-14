from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ClaimStatus


class ClaimCreate(BaseModel):
    """Schema para criação de reivindicação de item"""
    proof_description: str


class ClaimStatusUpdate(BaseModel):
    """Schema para atualização de status de reivindicação"""
    status: ClaimStatus
    notes: Optional[str] = None


class ClaimResponse(BaseModel):
    """DTO básico para reivindicação"""
    id: uuid.UUID
    item_id: uuid.UUID
    requester_id: uuid.UUID
    proof_description: str
    status: ClaimStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RequesterInfo(BaseModel):
    """Informações básicas do solicitante"""
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ItemInfo(BaseModel):
    """Informações básicas do item"""
    id: uuid.UUID
    title: str
    location_name: str

    model_config = ConfigDict(from_attributes=True)


class ClaimDetailResponse(BaseModel):
    """DTO detalhado para reivindicação com dados do solicitante e item"""
    id: uuid.UUID
    item_id: uuid.UUID
    requester_id: uuid.UUID
    proof_description: str
    status: ClaimStatus
    created_at: datetime
    requester: RequesterInfo
    item: ItemInfo

    model_config = ConfigDict(from_attributes=True)


class ClaimListResponse(BaseModel):
    """DTO para lista paginada de reivindicações"""
    items: list[ClaimDetailResponse]
    total: int
    page: int
    page_size: int

    model_config = ConfigDict(from_attributes=True)
