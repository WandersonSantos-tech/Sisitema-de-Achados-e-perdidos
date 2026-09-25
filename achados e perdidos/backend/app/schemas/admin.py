from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import UserRole


class CategoryCreate(BaseModel):
    """Schema para criação de categoria"""
    name: str = Field(..., min_length=3, max_length=80)
    description: Optional[str] = Field(None, max_length=500)


class CategoryUpdate(BaseModel):
    """Schema para atualização de categoria"""
    name: Optional[str] = Field(None, min_length=3, max_length=80)
    description: Optional[str] = Field(None, max_length=500)


class CategoryResponse(BaseModel):
    """DTO para categoria"""
    id: int
    name: str
    description: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class AdminUserStatusUpdate(BaseModel):
    """Schema para alteração de status de usuário"""
    is_active: Optional[bool] = Field(
        None, description="Ativar/desativar usuário")
    role: Optional[UserRole] = Field(
        None, description="Alterar permissão do usuário")


class AdminUserResponse(BaseModel):
    """DTO para usuário no painel admin"""
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    created_at: str  # ISO format

    model_config = ConfigDict(from_attributes=True)


class AdminUsersListResponse(BaseModel):
    """Lista paginada de usuários para admin"""
    items: list[AdminUserResponse]
    total: int
    page: int
    page_size: int

    model_config = ConfigDict(from_attributes=True)


class CategoryStatsItem(BaseModel):
    """Estatística de categoria"""
    category_name: str
    count: int


class LocationStatsItem(BaseModel):
    """Estatística de localização"""
    location_name: str
    count: int


class AdminStatsResponse(BaseModel):
    """DTO com métricas consolidadas do sistema"""
    total_users: int = Field(..., description="Total de usuários cadastrados")
    total_active_items: int = Field(..., description="Total de itens ativos")
    total_returned_items: int = Field(...,
                                      description="Total de itens devolvidos")
    return_success_rate: Optional[float] = Field(
        None, description="Taxa de sucesso de devoluções em %")
    top_categories: list[CategoryStatsItem] = Field(
        ..., description="Top 5 categorias")
    top_locations: list[LocationStatsItem] = Field(
        ..., description="Top 5 locais")
    pending_reports: int = Field(...,
                                 description="Denúncias pendentes de análise")

    model_config = ConfigDict(from_attributes=True)
