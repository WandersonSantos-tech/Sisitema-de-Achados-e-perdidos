"""Serviço para gerenciar denúncias (reports) de usuários e itens."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreate, ReportResolveUpdate

if TYPE_CHECKING:
    from app.models.item import Item

logger = logging.getLogger(__name__)


async def create_report(
    db: AsyncSession,
    reporter: User,
    report_in: ReportCreate,
) -> Report:
    """
    Cria uma denúncia de usuário ou item.

    Validações:
    - Pelo menos um alvo (usuário ou item) deve ser informado
    - Usuário denunciado/item deve existir
    - Um usuário não pode denunciar a si próprio

    Args:
        db: Sessão de banco de dados
        reporter: Usuário que está fazendo a denúncia
        report_in: Dados da denúncia

    Returns:
        Report: Entidade de denúncia criada

    Raises:
        ValueError: Se validações falharem
    """
    from app.models.item import Item

    # Validar que pelo menos um alvo foi informado
    if not report_in.reported_user_id and not report_in.reported_item_id:
        raise ValueError(
            "Pelo menos um alvo (usuário ou item) deve ser informado"
        )

    # Se denunciando um usuário, validar que ele existe e não é o próprio reporter
    if report_in.reported_user_id:
        if report_in.reported_user_id == reporter.id:
            raise ValueError("Você não pode denunciar a si próprio")

        result = await db.execute(
            select(User).where(User.id == report_in.reported_user_id)
        )
        reported_user = result.scalar_one_or_none()

        if not reported_user:
            raise ValueError(
                f"Usuário {report_in.reported_user_id} não encontrado"
            )

    # Se denunciando um item, validar que ele existe
    if report_in.reported_item_id:
        result = await db.execute(
            select(Item).where(Item.id == report_in.reported_item_id)
        )
        reported_item = result.scalar_one_or_none()

        if not reported_item:
            raise ValueError(
                f"Item {report_in.reported_item_id} não encontrado"
            )

    # Criar denúncia
    report = Report(
        reporter_id=reporter.id,
        reported_user_id=report_in.reported_user_id,
        reported_item_id=report_in.reported_item_id,
        reason=report_in.reason,
        is_resolved=False,
    )

    db.add(report)
    await db.commit()
    await db.refresh(report)

    logger.info(
        "Denúncia criada",
        extra={
            "user_id": reporter.id,
            "reported_user_id": report_in.reported_user_id,
            "reported_item_id": report_in.reported_item_id,
            "audit_action": "AUDIT_REPORT_CREATED",
        }
    )

    return report


async def list_reports(
    db: AsyncSession,
    resolved_filter: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Report], int]:
    """
    Lista denúncias com filtro opcional por status de resolução.

    Args:
        db: Sessão de banco de dados
        resolved_filter: None (todas), True (resolvidas), False (pendentes)
        page: Número da página (1-indexed)
        page_size: Tamanho da página

    Returns:
        Tupla (lista de reports, total de registros)
    """
    filters = []

    if resolved_filter is not None:
        filters.append(Report.is_resolved == resolved_filter)

    # Contar total
    count_result = await db.scalar(
        select(func.count()).select_from(Report).where(*filters)
    )
    total = count_result or 0

    # Buscar página
    result = await db.execute(
        select(Report)
        .where(*filters)
        .order_by(Report.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    reports = result.scalars().all()

    return reports, total


async def resolve_report(
    db: AsyncSession,
    report_id: UUID,
    resolve_in: ReportResolveUpdate,
    admin: User,
) -> Report:
    """
    Marca uma denúncia como resolvida com parecer do moderador.

    Args:
        db: Sessão de banco de dados
        report_id: ID da denúncia
        resolve_in: Dados da resolução (is_resolved, resolution_notes)
        admin: Usuário admin que está resolvendo

    Returns:
        Report: Entidade atualizada

    Raises:
        ValueError: Se denúncia não for encontrada
    """
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if not report:
        raise ValueError(f"Denúncia {report_id} não encontrada")

    # Atualizar status de resolução
    report.is_resolved = resolve_in.is_resolved
    # Se houver notas de resolução, armazená-las (seria necessário adicionar campo ao modelo)
    # Por enquanto apenas marcamos como resolvida

    await db.commit()
    await db.refresh(report)

    logger.info(
        "Denúncia resolvida",
        extra={
            "admin_id": admin.id,
            "report_id": report_id,
            "is_resolved": resolve_in.is_resolved,
            "notes": resolve_in.resolution_notes,
            "audit_action": "AUDIT_REPORT_RESOLVED",
        }
    )

    return report


async def get_pending_reports_count(db: AsyncSession) -> int:
    """
    Retorna o número de denúncias pendentes de resolução.

    Args:
        db: Sessão de banco de dados

    Returns:
        Número de denúncias pendentes
    """
    from sqlalchemy import func

    result = await db.scalar(
        select(func.count()).select_from(Report).where(
            Report.is_resolved == False
        )
    )

    return result or 0
