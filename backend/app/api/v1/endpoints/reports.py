"""Envio e acompanhamento de denúncias por usuários autenticados."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db
from app.models.enums import ItemStatus, ItemType, UserRole
from app.models.item import Item
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreate, ReportDetailResponse, ReportResponse
from app.services.report_service import create_report

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("", response_model=ReportResponse, status_code=201)
async def submit_report(body: ReportCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        return ReportResponse.model_validate(await create_report(db, current_user, body))
    except ValueError as exc:
        raise HTTPException(400, str(exc))

@router.get("")
async def my_reports(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    filters = [Report.reporter_id == current_user.id]
    total = await db.scalar(select(func.count()).select_from(Report).where(*filters))
    rows = (await db.scalars(select(Report).where(*filters).order_by(Report.created_at.desc()).offset((page-1)*page_size).limit(page_size))).all()
    return {"items": [ReportResponse.model_validate(x) for x in rows], "total": total, "page": page, "page_size": page_size}

@router.get("/targets")
async def report_targets(search: str = "", page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Só publicações de itens perdidos: objetos encontrados e detalhes reservados
    # continuam protegidos no painel da equipe.
    filters = [Item.type == ItemType.PERDIDO, Item.status.notin_([ItemStatus.CANCELADO, ItemStatus.DEVOLVIDO]), Item.user_id != current_user.id, Item.title.ilike(f"%{search}%")]
    total = await db.scalar(select(func.count()).select_from(Item).where(*filters))
    rows = (await db.execute(select(Item, User.name).join(User, User.id == Item.user_id).where(*filters).order_by(Item.created_at.desc()).offset((page-1)*page_size).limit(page_size))).all()
    return {"items": [{"id": item.id, "title": item.title, "description": item.description, "location_name": item.location_name, "user_id": item.user_id, "user_name": name} for item, name in rows], "total": total, "page": page, "page_size": page_size}

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(404, "Denúncia não encontrada")
    if current_user.role != UserRole.ADMIN and report.reporter_id != current_user.id:
        raise HTTPException(403, "Você não tem permissão para visualizar esta denúncia")
    return ReportResponse.model_validate(report)
