from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class CategoryResponse(BaseModel):
    """DTO para resposta de categoria"""
    id: int
    name: str

    model_config = {"from_attributes": True}


class ItemImageResponse(BaseModel):
    """DTO para resposta de imagem de item"""
    id: uuid.UUID
    item_id: uuid.UUID
    url: str

    model_config = {"from_attributes": True}


class ItemCreate(BaseModel):
    """DTO para criação de item"""
    category_id: int
    type: str = Field(..., description="PERDIDO ou ENCONTRADO")
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)
    secret_details: Optional[str] = None
    location_name: str = Field(..., max_length=255)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    event_date: datetime.datetime


class ItemUpdate(BaseModel):
    """DTO para atualização de item"""
    category_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = Field(None, min_length=10)
    secret_details: Optional[str] = None
    location_name: Optional[str] = Field(None, max_length=255)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    event_date: Optional[datetime.datetime] = None


class ItemResponse(BaseModel):
    """DTO para resposta de item"""
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: int
    type: str
    title: str
    description: str
    secret_details: Optional[str] = None
    location_name: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    event_date: datetime.datetime
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    category: Optional[CategoryResponse] = None
    images: list[ItemImageResponse] = []

    model_config = {"from_attributes": True}


class ItemListResponse(BaseModel):
    """DTO para lista de itens com paginação"""
    total: int
    page: int
    page_size: int
    items: list[ItemResponse]
