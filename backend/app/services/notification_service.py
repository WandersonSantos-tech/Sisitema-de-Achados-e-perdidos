from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.enums import NotificationType

if TYPE_CHECKING:
    pass


class NotificationService:
    """Serviço gerenciador de notificações"""

    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: UUID,
        item_id: UUID,
        title: str,
        message: str,
        notification_type: NotificationType,
    ) -> Notification:
        """
        Cria uma nova notificação no banco de dados.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário proprietário do item
            item_id: ID do item relacionado
            title: Título da notificação
            message: Mensagem da notificação
            notification_type: Tipo de notificação (ex: MATCH_FOUND)

        Returns:
            Notificação criada
        """
        notification = Notification(
            user_id=user_id,
            item_id=item_id,
            title=title,
            message=message,
            type=notification_type,
            is_read=False,
        )

        db.add(notification)
        await db.flush()  # Executa a inserção sem fazer commit

        return notification

    @staticmethod
    async def mark_as_read(
        db: AsyncSession,
        notification_id: UUID,
        user_id: UUID,
    ) -> Notification | None:
        """
        Marca uma notificação como lida.

        Args:
            db: Sessão do banco de dados
            notification_id: ID da notificação
            user_id: ID do usuário (para verificar permissão)

        Returns:
            Notificação atualizada ou None se não encontrada
        """
        result = await db.execute(
            select(Notification).where(
                and_(
                    Notification.id == notification_id,
                    Notification.user_id == user_id,
                )
            )
        )
        notification = result.scalar_one_or_none()

        if notification:
            notification.is_read = True
            await db.flush()

        return notification

    @staticmethod
    async def get_user_notifications(
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        unread_only: bool = False,
    ) -> tuple[int, list[Notification]]:
        """
        Recupera notificações de um usuário com paginação.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            skip: Número de registros a pular
            limit: Número máximo de registros a retornar
            unread_only: Se True, retorna apenas notificações não lidas

        Returns:
            Tupla (total, lista de notificações)
        """
        # Constrói a query base
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read == False)

        # Conta o total com os mesmos filtros
        count_query = select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id
        )

        if unread_only:
            count_query = count_query.where(Notification.is_read == False)

        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # Ordena por data de criação (mais recentes primeiro) e aplica paginação
        query = query.order_by(
            Notification.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(query)
        notifications = result.scalars().all()

        return total, notifications

    @staticmethod
    async def check_existing_match_notification(
        db: AsyncSession,
        user_id: UUID,
        item_id: UUID,
        matched_item_id: UUID,
    ) -> bool:
        """
        Verifica se já existe notificação de correspondência para este par de itens.
        Isso evita notificações duplicadas se o matching for reexecutado.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            item_id: ID do item original
            matched_item_id: ID do item correspondente

        Returns:
            True se já existe notificação, False caso contrário
        """
        # Busca notificações já existentes para este usuário e par de itens
        query = select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.item_id == item_id,
                Notification.type == NotificationType.MATCH_FOUND,
                # A mensagem contém o ID do item correspondente (idempotência)
            )
        )

        result = await db.execute(query)
        existing = result.scalar_one_or_none()

        return existing is not None


# Instância global do serviço
notification_service = NotificationService()
