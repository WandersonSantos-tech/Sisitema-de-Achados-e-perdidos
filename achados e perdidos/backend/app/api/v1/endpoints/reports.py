"""Endpoints para gerenciar denúncias de usuários e itens."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreate, ReportDetailResponse, ReportListResponse, ReportResponse
from app.services.report_service import (
    create_report,
    list_reports,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar denúncia",
    description="Criação de denúncia anônima para outros usuários ou itens suspeitos (Requer autenticação)",
)
async def create_report_endpoint(
    report_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    """
    Cria uma denúncia anônima de um usuário ou item.

    Validações:
    - Pelo menos um alvo (usuário ou item) deve ser informado
    - Usuário não pode denunciar a si próprio
    - Alvo denunciado deve existir

    Implementa RF16 - Moderação de Denúncias.

    Retorna HTTP 201 Created com os dados da denúncia criada.
    """
    try:
        report = await create_report(db, current_user, report_in)
        return ReportResponse.model_validate(report)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/{report_id}",
    response_model=ReportDetailResponse,
    summary="Obter detalhes de denúncia",
    description="Retorna os detalhes completos de uma denúncia específica",
)
async def get_report(
    report_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportDetailResponse:
    """
    Retorna detalhes completos de uma denúncia específica.

    Apenas admiradores e o reporter podem visualizar detalhes.
    """
    # Buscar report com carregamento antecipado de relacionamentos
    result = await db.execute(
        select(Report)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Denúncia não encontrada",
        )

    # Verificar permissão: apenas admin ou o reporter
    from app.models.enums import UserRole

    if (
        current_user.role != UserRole.ADMIN
        and report.reporter_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para visualizar esta denúncia",
        )

    return ReportDetailResponse.model_validate(report)
