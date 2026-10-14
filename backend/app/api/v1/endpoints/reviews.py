"""Endpoints para gerenciar avaliações de usuários."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewDetailResponse, ReviewResponse, UserReviewsResponse
from app.services.review_service import (
    create_review,
    get_average_rating,
    get_user_reviews,
)

router = APIRouter(prefix="/items", tags=["reviews"])


@router.post(
    "/{item_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar avaliação pós-devolução",
    description="Registra uma avaliação entre os usuários envolvidos na transação de um item após sua devolução",
)
async def create_item_review(
    item_id: UUID,
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    """
    Cria uma avaliação para um item que foi devolvido.

    Validações:
    - Item deve estar com status DEVOLVIDO (RF15)
    - Apenas as partes envolvidas na transação podem avaliar
    - Cada usuário só pode avaliar uma vez por item

    Retorna HTTP 201 Created com os dados da avaliação.
    """
    try:
        review = await create_review(db, item_id, current_user, review_in)
        return ReviewResponse.model_validate(review)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/{item_id}/reviews",
    response_model=list[ReviewDetailResponse],
    summary="Listar avaliações de um item",
    description="Retorna todas as avaliações associadas a um item específico",
)
async def list_item_reviews(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[ReviewDetailResponse]:
    """
    Retorna todas as avaliações associadas a um item.
    """
    # Buscar reviews com carregamento antecipado do reviewer e filtro do item_id
    result = await db.execute(
        select(Review)
        .options(selectinload(Review.reviewer))
        .where(Review.item_id == item_id)
    )
    reviews = result.scalars().all()
    return [ReviewDetailResponse.model_validate(review) for review in reviews]


# Novo router para endpoints específicos de usuários
user_reviews_router = APIRouter(prefix="/users", tags=["reviews"])


@user_reviews_router.get(
    "/{user_id}/reviews",
    response_model=UserReviewsResponse,
    summary="Consultar avaliações recebidas por usuário",
    description="Retorna todas as avaliações recebidas por um usuário com cálculo de média de estrelas",
)
async def get_user_reviews_endpoint(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> UserReviewsResponse:
    """
    Retorna todas as avaliações recebidas por um usuário com:
    - Lista detalhada de avaliações
    - Média de rating (1-5)
    - Total de avaliações recebidas

    Implementa RF15 - Encerramento e Avaliação do Processo.
    """
    reviews, average = await get_user_reviews(db, user_id)

    # Carregar detalhes do reviewer para cada review
    reviews_detail = [
        ReviewDetailResponse.model_validate(r) for r in reviews
    ]

    return UserReviewsResponse(
        user_id=user_id,
        total_reviews=len(reviews),
        average_rating=average,
        reviews=reviews_detail,
    )
