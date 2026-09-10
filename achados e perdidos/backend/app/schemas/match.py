from __future__ import annotations

import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class MatchScoreDetails(BaseModel):
    """Detalhes da pontuação de cada critério"""
    category_score: float = Field(
        default=0.0, ge=0.0, le=100.0, description="Score da categoria (0-30%)")
    textual_similarity_score: float = Field(
        default=0.0, ge=0.0, le=100.0, description="Score de similaridade textual (0-40%)")
    temporal_proximity_score: float = Field(
        default=0.0, ge=0.0, le=100.0, description="Score de proximidade temporal (0-15%)")
    geographical_proximity_score: float = Field(
        default=0.0, ge=0.0, le=100.0, description="Score de proximidade geográfica (0-15%)")


class MatchResultResponse(BaseModel):
    """DTO para exibir correspondência encontrada"""
    item_id: uuid.UUID
    matched_item_id: uuid.UUID
    similarity_score: float = Field(
        ge=0.0, le=100.0, description="Score de similaridade total (0-100%)")
    matched_item_title: str
    matched_item_description: str
    matched_item_location_name: str
    matched_item_event_date: str
    matched_item_type: str
    score_details: MatchScoreDetails

    model_config = {"from_attributes": True}


class MatchListResponse(BaseModel):
    """DTO para lista de correspondências"""
    total: int
    items: list[MatchResultResponse]
