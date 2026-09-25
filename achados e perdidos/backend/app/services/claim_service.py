from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.claim import Claim
from app.models.enums import ClaimStatus, ItemStatus
from app.models.item import Item
from app.models.user import User
from app.schemas.claim import ClaimCreate, ClaimStatusUpdate

if TYPE_CHECKING:
    pass


class ClaimService:
    """Serviço de negócio para operações de reivindicação com regras de validação"""

    @staticmethod
    async def create_claim(
        db: AsyncSession,
        item_id: uuid.UUID,
        requester: User,
        claim_in: ClaimCreate,
    ) -> Claim:
        """
        Cria uma nova reivindicação com validações rigorosas.

        Regras:
        1. Impede que o autor do anúncio abra reivindicação para seu próprio item
        2. Impede reivindicações se item está DEVOLVIDO ou CANCELADO
        3. Impede múltiplas reivindicações pendentes do mesmo usuário para o mesmo item

        Disparadores:
        - Notificação CLAIM_RECEIVED para o criador do anúncio
        """
        # Buscar item com proprietário
        result = await db.execute(
            select(Item)
            .where(Item.id == item_id)
            .options(selectinload(Item.user))
        )
        item = result.scalar_one_or_none()

        if not item:
            raise ValueError(f"Item {item_id} não encontrado")

        # Regra 1: Impedir que o autor abra reivindicação para seu próprio item
        if item.user_id == requester.id:
            raise PermissionError(
                "Você não pode abrir uma reivindicação para seu próprio item"
            )

        # Regra 2: Impedir reivindicações se item já está DEVOLVIDO ou CANCELADO
        if item.status in (ItemStatus.DEVOLVIDO, ItemStatus.CANCELADO):
            raise ValueError(
                f"Não é possível abrir reivindicação para item com status {item.status.value}"
            )

        # Regra 3: Impedir múltiplas reivindicações pendentes do mesmo usuário
        result = await db.execute(
            select(Claim).where(
                and_(
                    Claim.item_id == item_id,
                    Claim.requester_id == requester.id,
                    Claim.status == ClaimStatus.PENDENTE,
                )
            )
        )
        existing_pending = result.scalar_one_or_none()

        if existing_pending:
            raise ValueError(
                "Você já possui uma reivindicação pendente para este item"
            )

        # Criar reivindicação
        claim = Claim(
            item_id=item_id,
            requester_id=requester.id,
            proof_description=claim_in.proof_description,
            status=ClaimStatus.PENDENTE,
        )

        db.add(claim)
        await db.flush()

        return claim

    @staticmethod
    async def update_claim_status(
        db: AsyncSession,
        claim_id: uuid.UUID,
        current_user: User,
        status_in: ClaimStatusUpdate,
    ) -> Claim:
        """
        Atualiza o status de uma reivindicação com validação de permissões.

        Regra de Permissão:
        - Apenas o publicador original do item ou administradores podem aprovar/rejeitar

        Efeitos ao aprovar:
        1. Atualiza status da reivindicação para APROVADA
        2. Transiciona item para EM_NEGOCIACAO ou DEVOLVIDO
        3. Registra mudança em item_status_history com changed_by = current_user.id
        4. Dispara notificação CLAIM_UPDATED para o solicitante
        """
        from app.models.user import UserRole
        from app.services.notification_service import NotificationService
        from app.models.enums import NotificationType
        from app.models.status_history import StatusHistory

        # Buscar reivindicação com dados relacionados
        result = await db.execute(
            select(Claim)
            .where(Claim.id == claim_id)
            .options(
                selectinload(Claim.item).selectinload(Item.user),
                selectinload(Claim.requester),
            )
        )
        claim = result.scalar_one_or_none()

        if not claim:
            raise ValueError(f"Reivindicação {claim_id} não encontrada")

        # Validar permissões: apenas owner do item ou admin
        if current_user.id != claim.item.user_id and current_user.role != UserRole.ADMIN:
            raise PermissionError(
                "Apenas o proprietário do item ou administradores podem atualizar reivindicações"
            )

        # Atualizar status da reivindicação
        claim.status = status_in.status

        if status_in.status == ClaimStatus.APROVADA:
            # Transicionar item para EM_NEGOCIACAO
            old_status = claim.item.status
            claim.item.status = ItemStatus.EM_NEGOCIACAO

            # Registrar histórico de mudança
            history_entry = StatusHistory(
                item_id=claim.item.id,
                old_status=old_status,
                new_status=ItemStatus.EM_NEGOCIACAO,
                changed_by=current_user.id,
                reason=f"Reivindicação #{claim_id} aprovada",
            )
            db.add(history_entry)

            # Disparar notificação para solicitante
            await NotificationService.create_notification(
                db,
                user_id=claim.requester_id,
                item_id=claim.item_id,
                title="Reivindicação Aprovada",
                message=f"Sua reivindicação para o item '{claim.item.title}' foi aprovada!",
                notification_type=NotificationType.CLAIM_UPDATED,
            )

        elif status_in.status == ClaimStatus.REJEITADA:
            # Disparar notificação para solicitante
            reason = status_in.notes or "Rejeitada"
            await NotificationService.create_notification(
                db,
                user_id=claim.requester_id,
                item_id=claim.item_id,
                title="Reivindicação Rejeitada",
                message=f"Sua reivindicação para o item '{claim.item.title}' foi rejeitada. Motivo: {reason}",
                notification_type=NotificationType.CLAIM_UPDATED,
            )

        db.add(claim)
        await db.flush()

        return claim

    @staticmethod
    async def get_claim_by_id(db: AsyncSession, claim_id: uuid.UUID) -> Optional[Claim]:
        """Buscar reivindicação por ID com relacionamentos carregados"""
        result = await db.execute(
            select(Claim)
            .where(Claim.id == claim_id)
            .options(
                selectinload(Claim.item),
                selectinload(Claim.requester),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_item_claims(
        db: AsyncSession,
        item_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Claim], int]:
        """Buscar todas as reivindicações de um item com paginação"""
        # Contar total
        count_result = await db.execute(
            select(func.count(Claim.id)).where(Claim.item_id == item_id)
        )
        total = count_result.scalar() or 0

        # Buscar com paginação
        result = await db.execute(
            select(Claim)
            .where(Claim.item_id == item_id)
            .options(
                selectinload(Claim.requester),
                selectinload(Claim.item),
            )
            .order_by(Claim.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        claims = result.scalars().all()

        return claims, total

    @staticmethod
    async def get_user_claims(
        db: AsyncSession,
        user_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Claim], int]:
        """Buscar todas as reivindicações do usuário logado"""
        # Contar total
        count_result = await db.execute(
            select(func.count(Claim.id)).where(Claim.requester_id == user_id)
        )
        total = count_result.scalar() or 0

        # Buscar com paginação
        result = await db.execute(
            select(Claim)
            .where(Claim.requester_id == user_id)
            .options(
                selectinload(Claim.requester),
                selectinload(Claim.item),
            )
            .order_by(Claim.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        claims = result.scalars().all()

        return claims, total
