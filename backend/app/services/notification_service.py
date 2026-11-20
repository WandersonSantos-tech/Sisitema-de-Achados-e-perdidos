
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.enums import NotificationType
from app.services.push_service import agendar_push


class NotificationService:
    """Serviço gerenciador de notificações."""

    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: UUID,
        item_id: UUID | None,
        title: str,
        message: str,
        notification_type: NotificationType,
    ) -> Notification:

        notification = Notification(
            user_id=user_id,
            item_id=item_id,
            title=title,
            message=message,
            type=notification_type,
            is_read=False,
        )

        db.add(notification)
        await db.flush()

        tipo = getattr(
            notification_type,
            "value",
            str(notification_type),
        )

        agendar_push(
            db=db,
            user_id=user_id,
            notification_id=notification.id,
            title=title,
            message=message,
            notification_type=tipo,
            item_id=item_id,
        )

        return notification

    @staticmethod
    async def mark_as_read(
        db: AsyncSession,
        notification_id: UUID,
        user_id: UUID,
    ) -> Notification | None:

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

        query = select(Notification).where(
            Notification.user_id == user_id
        )

        if unread_only:
            query = query.where(
                Notification.is_read.is_(False)
            )

        count_query = select(func.count()).select_from(
            Notification
        ).where(
            Notification.user_id == user_id
        )

        if unread_only:
            count_query = count_query.where(
                Notification.is_read.is_(False)
            )

        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        query = (
            query.order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

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

        query = select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.item_id == item_id,
                Notification.type == NotificationType.MATCH_FOUND,
            )
        )

        result = await db.execute(query)
        existing = result.scalar_one_or_none()

        return existing is not None


notification_service = NotificationService()
