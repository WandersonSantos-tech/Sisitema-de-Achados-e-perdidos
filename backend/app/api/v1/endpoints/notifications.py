from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
)
from app.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(1, ge=1, description="Número da página"),
    page_size: int = Query(
        20, ge=1, le=100, description="Notificações por página"),
    unread_only: bool = Query(False, description="Mostrar apenas não lidas"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Lista as notificações do usuário autenticado com paginação.

    - **page**: Número da página (padrão: 1)
    - **page_size**: Notificações por página (padrão: 20, máximo: 100)
    - **unread_only**: Se True, retorna apenas notificações não lidas (padrão: False)
    """
    skip = (page - 1) * page_size

    total, notifications = await notification_service.get_user_notifications(
        db,
        current_user.id,
        skip=skip,
        limit=page_size,
        unread_only=unread_only,
    )

    return NotificationListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[NotificationResponse.model_validate(
            notif) for notif in notifications],
    )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Marca uma notificação específica como lida.
    Apenas o proprietário da notificação pode marcá-la como lida.
    """
    notification = await notification_service.mark_as_read(
        db,
        notification_id,
        current_user.id,
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada ou acesso negado",
        )

    await db.commit()

    return NotificationResponse.model_validate(notification)


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Recupera os detalhes de uma notificação específica.
    Apenas o proprietário pode acessar.
    """
    from sqlalchemy import select, and_
    from app.models.notification import Notification

    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == current_user.id,
            )
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada ou acesso negado",
        )

    return NotificationResponse.model_validate(notification)
