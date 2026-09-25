from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    """Schema para criação de avaliação de usuário"""
    rating: int = Field(..., ge=1, le=5, description="Nota de 1 a 5 estrelas")
    comment: Optional[str] = Field(
        None, max_length=1000, description="Comentário opcional")


class ReviewResponse(BaseModel):
    """DTO para exibição de avaliação"""
    id: uuid.UUID
    item_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewed_user_id: uuid.UUID
    rating: int
    comment: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserReviewInfo(BaseModel):
    """Informações de reviewer para embed em resposta"""
    id: uuid.UUID
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class ReviewDetailResponse(BaseModel):
    """DTO detalhado com informações do reviewer"""
    id: uuid.UUID
    item_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewed_user_id: uuid.UUID
    rating: int
    comment: Optional[str]
    created_at: datetime
    reviewer: Optional[UserReviewInfo] = None

    model_config = ConfigDict(from_attributes=True)


class UserReviewsResponse(BaseModel):
    """Respostas de avaliações recebidas por um usuário com média"""
    user_id: uuid.UUID
    total_reviews: int
    average_rating: Optional[float]  # None se não há avaliações
    reviews: list[ReviewDetailResponse]

    model_config = ConfigDict(from_attributes=True)
