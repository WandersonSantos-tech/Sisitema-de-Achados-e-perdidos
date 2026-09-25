from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ReportCreate(BaseModel):
    """Schema para criação de denúncia"""
    reason: str = Field(..., min_length=10, max_length=2000,
                        description="Descrição detalhada do motivo")
    reported_user_id: Optional[uuid.UUID] = Field(
        None, description="ID do usuário denunciado (opcional)")
    reported_item_id: Optional[uuid.UUID] = Field(
        None, description="ID do item denunciado (opcional)")

    @field_validator("reported_user_id", "reported_item_id")
    @classmethod
    def at_least_one_target(cls, v, info):
        """Valida que pelo menos um alvo (usuário ou item) foi informado"""
        if info.data.get("reported_user_id") is None and info.data.get("reported_item_id") is None:
            raise ValueError(
                "Pelo menos um alvo (usuário ou item) deve ser informado")
        return v


class ReportResponse(BaseModel):
    """DTO básico para denúncia"""
    id: uuid.UUID
    reporter_id: uuid.UUID
    reported_user_id: Optional[uuid.UUID]
    reported_item_id: Optional[uuid.UUID]
    reason: str
    is_resolved: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportResolveUpdate(BaseModel):
    """Schema para resolução de denúncia"""
    is_resolved: bool = Field(...)
    resolution_notes: Optional[str] = Field(
        None, max_length=500, description="Notas da moderação")


class ReporterInfo(BaseModel):
    """Informações do denunciante"""
    id: uuid.UUID
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class ReportedUserInfo(BaseModel):
    """Informações do usuário denunciado"""
    id: uuid.UUID
    name: str
    email: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class ReportedItemInfo(BaseModel):
    """Informações do item denunciado"""
    id: uuid.UUID
    title: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class ReportDetailResponse(BaseModel):
    """DTO detalhado para denúncia com informações completas"""
    id: uuid.UUID
    reporter_id: uuid.UUID
    reported_user_id: Optional[uuid.UUID]
    reported_item_id: Optional[uuid.UUID]
    reason: str
    is_resolved: bool
    created_at: datetime
    reporter: Optional[ReporterInfo] = None
    reported_user: Optional[ReportedUserInfo] = None
    reported_item: Optional[ReportedItemInfo] = None

    model_config = ConfigDict(from_attributes=True)


class ReportListResponse(BaseModel):
    """Lista paginada de denúncias"""
    items: list[ReportDetailResponse]
    total: int
    page: int
    page_size: int

    model_config = ConfigDict(from_attributes=True)
