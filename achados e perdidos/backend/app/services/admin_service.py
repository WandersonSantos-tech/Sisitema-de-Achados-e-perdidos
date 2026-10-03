"""Serviço para gerenciar operações administrativas."""
from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.item import Item
from app.models.report import Report
from app.models.user import User
from app.models.enums import ItemStatus, UserRole
from app.schemas.admin import AdminStatsResponse, CategoryStatsItem, LocationStatsItem

logger = logging.getLogger(__name__)


async def get_system_statistics(
    db: AsyncSession,
) -> AdminStatsResponse:
    """
    Executa agregações otimizadas para consolidar métricas do sistema.

    Métricas consolidadas:
    - Total de usuários cadastrados
    - Total de itens ativos
    - Total de itens devolvidos com sucesso
    - Taxa de sucesso de devoluções
    - Top 5 categorias com mais ocorrências
    - Top 5 locais com mais registros
    - Total de denúncias pendentes

    Args:
        db: Sessão de banco de dados

    Returns:
        AdminStatsResponse com todas as métricas consolidadas
    """
    # Total de usuários
    total_users = await db.scalar(
        select(func.count(User.id))
    ) or 0

    # Total e categorias de itens
    active_items = await db.scalar(
        select(func.count(Item.id)).where(
            Item.status.notin_([ItemStatus.DEVOLVIDO, ItemStatus.CANCELADO])
        )
    ) or 0

    returned_items = await db.scalar(
        select(func.count(Item.id)).where(Item.status == ItemStatus.DEVOLVIDO)
    ) or 0

    # Taxa de sucesso
    total_completed = active_items + returned_items
    return_success_rate = (
        (returned_items * 100 / total_completed)
        if total_completed > 0
        else 0.0
    )

    # Top 5 categorias
    categories_result = await db.execute(
        select(
            Category.name,
            func.count(Item.id).label("count"),
        )
        .join(Item, Item.category_id == Category.id)
        .group_by(Category.id, Category.name)
        .order_by(desc(func.count(Item.id)))
        .limit(5)
    )

    top_categories = [
        CategoryStatsItem(category_name=name, count=count)
        for name, count in categories_result
    ]

    # Top 5 locais
    locations_result = await db.execute(
        select(
            Item.location_name,
            func.count(Item.id).label("count"),
        )
        .group_by(Item.location_name)
        .order_by(desc(func.count(Item.id)))
        .limit(5)
    )

    top_locations = [
        LocationStatsItem(location_name=name, count=count)
        for name, count in locations_result
    ]

    # Denúncias pendentes
    pending_reports = await db.scalar(
        select(func.count(Report.id)).where(Report.is_resolved == False)
    ) or 0

    return AdminStatsResponse(
        total_users=total_users,
        total_active_items=active_items,
        total_returned_items=returned_items,
        return_success_rate=round(return_success_rate, 1),
        top_categories=top_categories,
        top_locations=top_locations,
        pending_reports=pending_reports,
    )


async def toggle_user_status(
    db: AsyncSession,
    user_id: UUID,
    is_active: bool,
    admin: User,
) -> User:
    """
    Bloqueia ou reativa o acesso de um usuário ao sistema.

    Args:
        db: Sessão de banco de dados
        user_id: ID do usuário a ser alterado
        is_active: True para ativar, False para bloquear
        admin: Usuário admin que está executando a ação

    Returns:
        User: Entidade atualizada

    Raises:
        ValueError: Se usuário não encontrado ou tentando alterar a si próprio
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise ValueError(f"Usuário {user_id} não encontrado")

    if user.id == admin.id:
        raise ValueError("Você não pode alterar seu próprio status")

    old_status = user.is_active
    user.is_active = is_active

    await db.commit()
    await db.refresh(user)

    action = "ativado" if is_active else "bloqueado"
    logger.info(
        f"Usuário {action}",
        extra={
            "admin_id": admin.id,
            "target_user_id": user_id,
            "old_status": old_status,
            "new_status": is_active,
            "audit_action": "AUDIT_USER_STATUS_CHANGED",
        }
    )

    return user


async def update_user_role(
    db: AsyncSession,
    user_id: UUID,
    new_role: UserRole,
    admin: User,
) -> User:
    """
    Altera o papel/permissões de um usuário (USER ou ADMIN).

    Args:
        db: Sessão de banco de dados
        user_id: ID do usuário
        new_role: Novo papel (UserRole.USER ou UserRole.ADMIN)
        admin: Usuário admin que está executando a ação

    Returns:
        User: Entidade atualizada

    Raises:
        ValueError: Se usuário não encontrado
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise ValueError(f"Usuário {user_id} não encontrado")

    old_role = user.role
    user.role = new_role

    await db.commit()
    await db.refresh(user)

    logger.info(
        "Role de usuário alterado",
        extra={
            "admin_id": admin.id,
            "target_user_id": user_id,
            "old_role": old_role.value,
            "new_role": new_role.value,
            "audit_action": "AUDIT_USER_ROLE_CHANGED",
        }
    )

    return user


async def delete_item_admin(
    db: AsyncSession,
    item_id: UUID,
    admin: User,
) -> None:
    """
    Remove diretamente uma publicação por ação administrativa.

    Usada para remover itens irregulares ou denunciados a partir do painel admin.

    Args:
        db: Sessão de banco de dados
        item_id: ID do item a ser removido
        admin: Usuário admin que está executando a ação

    Raises:
        ValueError: Se item não encontrado
    """
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()

    if not item:
        raise ValueError(f"Item {item_id} não encontrado")

    item_title = item.title
    item_user_id = item.user_id

    await db.delete(item)
    await db.commit()

    logger.info(
        "Item deletado administrativamente",
        extra={
            "admin_id": admin.id,
            "item_id": item_id,
            "item_title": item_title,
            "item_owner_id": item_user_id,
            "audit_action": "AUDIT_ITEM_ADMIN_DELETED",
        }
    )


async def list_users(
    db: AsyncSession,
    status_filter: bool | None = None,
    role_filter: UserRole | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[User], int]:
    """
    Lista usuários com filtros opcionais para o painel admin.

    Args:
        db: Sessão de banco de dados
        status_filter: None (todas), True (ativos), False (inativos)
        role_filter: Filtrar por role (USER ou ADMIN) ou None para todas
        page: Número da página (1-indexed)
        page_size: Tamanho da página

    Returns:
        Tupla (lista de usuários, total de registros)
    """
    filters = []

    if status_filter is not None:
        filters.append(User.is_active == status_filter)

    if role_filter is not None:
        filters.append(User.role == role_filter)

    # Contar total
    count_result = await db.scalar(
        select(func.count()).select_from(User).where(*filters)
    )
    total = count_result or 0

    # Buscar página
    result = await db.execute(
        select(User)
        .where(*filters)
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    users = result.scalars().all()

    return users, total
