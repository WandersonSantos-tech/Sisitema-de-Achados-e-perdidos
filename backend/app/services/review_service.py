"""Serviço para gerenciar avaliações de usuários."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ItemStatus
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate

if TYPE_CHECKING:
    from app.models.item import Item

logger = logging.getLogger(__name__)


async def create_review(
    db: AsyncSession,
    item_id: UUID,
    current_user: User,
    review_in: ReviewCreate,
) -> Review:
    """
    Cria uma avaliação após conclusão de uma transação de item.

    Regras:
    - Item deve estar com status DEVOLVIDO
    - O usuário autenticado deve ser uma das partes envolvidas (autor ou claimant)
    - Apenas uma avaliação por usuário por transação

    Args:
        db: Sessão de banco de dados
        item_id: ID do item sendo avaliado
        current_user: Usuário autenticado que faz a avaliação
        review_in: Dados da avaliação (rating, comment)

    Returns:
        Review: Entidade de avaliação criada

    Raises:
        ValueError: Se validações falharem
    """
    from app.models.claim import Claim
    from app.models.item import Item

    # Buscar item
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()

    if not item:
        raise ValueError(f"Item {item_id} não encontrado")

    # Regra 1: Item deve estar com status DEVOLVIDO
    if item.status != ItemStatus.DEVOLVIDO:
        raise ValueError(
            f"Item deve estar com status DEVOLVIDO para avaliação. "
            f"Status atual: {item.status}"
        )

    # Regra 2: Usuário autenticado deve ser parte envolvida
    # Pode ser o autor do item
    is_author = item.user_id == current_user.id

    # Ou pode ser o requester de uma claim aprovada
    is_claimant = False
    if not is_author:
        result = await db.execute(
            select(Claim).where(
                Claim.item_id == item_id,
                Claim.requester_id == current_user.id,
                Claim.status == "APROVADA",  # Apenas claims aprovadas
            )
        )
        claim = result.scalar_one_or_none()
        is_claimant = claim is not None

    if not is_author and not is_claimant:
        raise ValueError(
            "Apenas as partes envolvidas podem avaliar a transação"
        )

    # Determinar quem está sendo avaliado
    reviewed_user_id = None
    if is_author:
        # Se o avaliador é o autor, o avaliado é o requester
        result = await db.execute(
            select(Claim.requester_id).where(
                Claim.item_id == item_id,
                Claim.status == "APROVADA",
            )
        )
        reviewed_user_id = result.scalar_one_or_none()
    else:
        # Se o avaliador é o claimant, o avaliado é o autor
        reviewed_user_id = item.user_id

    if not reviewed_user_id:
        raise ValueError(
            "Não foi possível identificar o usuário para avaliação")

    # Regra 3: Impedir múltiplas avaliações do mesmo usuário na mesma transação
    result = await db.execute(
        select(Review).where(
            Review.item_id == item_id,
            Review.reviewer_id == current_user.id,
            Review.reviewed_user_id == reviewed_user_id,
        )
    )
    existing_review = result.scalar_one_or_none()

    if existing_review:
        raise ValueError(
            "Você já avaliou este item com este usuário"
        )

    # Criar avaliação
    review = Review(
        item_id=item_id,
        reviewer_id=current_user.id,
        reviewed_user_id=reviewed_user_id,
        rating=review_in.rating,
        comment=review_in.comment,
    )

    db.add(review)
    await db.commit()
    await db.refresh(review)

    logger.info(
        "Avaliação criada",
        extra={
            "user_id": current_user.id,
            "item_id": item_id,
            "reviewed_user_id": reviewed_user_id,
            "rating": review_in.rating,
            "audit_action": "AUDIT_REVIEW_CREATED",
        }
    )

    return review


async def get_user_reviews(
    db: AsyncSession,
    user_id: UUID,
) -> tuple[list[Review], float | None]:
    """
    Busca todas as avaliações recebidas por um usuário e calcula a média de rating.

    Args:
        db: Sessão de banco de dados
        user_id: ID do usuário

    Returns:
        Tupla (lista de reviews, média de rating)
    """
    # Buscar todas as reviews recebidas por este usuário
    result = await db.execute(
        select(Review)
        .where(Review.reviewed_user_id == user_id)
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()

    # Calcular média
    if not reviews:
        return reviews, None

    average = await db.scalar(
        select(func.avg(Review.rating)).where(
            Review.reviewed_user_id == user_id
        )
    )

    return reviews, float(average) if average else None


async def get_average_rating(
    db: AsyncSession,
    user_id: UUID,
) -> float | None:
    """
    Calcula a média de estrelas de um usuário.

    Args:
        db: Sessão de banco de dados
        user_id: ID do usuário

    Returns:
        Média de rating (1-5) ou None se sem avaliações
    """
    average = await db.scalar(
        select(func.avg(Review.rating)).where(
            Review.reviewed_user_id == user_id
        )
    )

    return float(average) if average else None
