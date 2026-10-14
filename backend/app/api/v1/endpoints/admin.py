from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin, get_db
from app.models.category import Category
from app.models.claim import Claim
from app.models.enums import ItemStatus, ItemType, NotificationType
from app.models.item import Item
from app.models.notification import Notification
from app.models.report import Report
from app.models.status_history import StatusHistory
from app.models.user import User
from app.schemas.admin import CategoryCreate, CategoryUpdate
from app.schemas.claim import ClaimDetailResponse
from app.schemas.item import ItemListResponse, ItemResponse
from app.schemas.report import ReportResponse, ReportDetailResponse
from app.services.moderation_service import decide_report, remove_publication
from app.services.matching_service import matching_service


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)


class ItemStatusInput(BaseModel):
    status: ItemStatus
    note: str | None = Field(None, max_length=255)


async def get_item_or_404(
    db: AsyncSession,
    item_id: UUID,
) -> Item:
    item = (
        await db.execute(
            select(Item)
            .options(
                selectinload(Item.category),
                selectinload(Item.images),
            )
            .where(Item.id == item_id)
        )
    ).scalar_one_or_none()

    if item is None:
        raise HTTPException(404, "Item não encontrado")

    return item


@router.get("/stats")
async def stats(
    db: AsyncSession = Depends(get_db),
):
    async def count(model, *filters):
        return (
            await db.scalar(
                select(func.count())
                .select_from(model)
                .where(*filters)
            )
        ) or 0

    active = await count(
        Item,
        Item.status.notin_(
            [
                ItemStatus.DEVOLVIDO,
                ItemStatus.CANCELADO,
            ]
        ),
    )

    returned = await count(
        Item,
        Item.status == ItemStatus.DEVOLVIDO,
    )

    categories = (
        await db.execute(
            select(
                Category.name,
                func.count(Item.id),
            )
            .join(
                Item,
                Item.category_id == Category.id,
            )
            .group_by(
                Category.id,
                Category.name,
            )
            .order_by(
                func.count(Item.id).desc()
            )
            .limit(5)
        )
    ).all()

    locations = (
        await db.execute(
            select(
                Item.location_name,
                func.count(Item.id),
            )
            .group_by(Item.location_name)
            .order_by(
                func.count(Item.id).desc()
            )
            .limit(5)
        )
    ).all()

    return {
        "total_users": await count(User),
        "blocked_users": await count(User, User.is_active.is_(False)),
        "removed_items": await count(Item, Item.status == ItemStatus.CANCELADO),
        "resolved_reports": await count(Report, Report.is_resolved.is_(True)),
        "total_active_items": active,
        "total_returned_items": returned,
        "return_success_rate": round(
            returned * 100 / (active + returned),
            1,
        )
        if active + returned
        else 0,
        "top_categories": [
            {
                "category_name": name,
                "count": n,
            }
            for name, n in categories
        ],
        "top_locations": [
            {
                "location_name": name,
                "count": n,
            }
            for name, n in locations
        ],
        "pending_reports": await count(
            Report,
            Report.is_resolved.is_(False),
        ),
    }


@router.get(
    "/items",
    response_model=ItemListResponse,
)
async def items(
    page: int = Query(1, ge=1),
    page_size: int = Query(
        20,
        ge=1,
        le=100,
    ),
    item_type: ItemType | None = None,
    status_filter: ItemStatus | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    filters = []

    if status_filter:
        filters.append(Item.status == status_filter)

    if item_type:
        filters.append(
            Item.type == item_type
        )

    if search:
        filters.append(
            or_(
                Item.title.ilike(
                    f"%{search}%"
                ),
                Item.location_name.ilike(
                    f"%{search}%"
                ),
            )
        )

    total = (
        await db.scalar(
            select(func.count())
            .select_from(Item)
            .where(*filters)
        )
        or 0
    )

    result = await db.execute(
        select(Item)
        .options(
            selectinload(Item.category),
            selectinload(Item.images),
        )
        .where(*filters)
        .order_by(Item.created_at.desc())
        .offset(
            (page - 1) * page_size
        )
        .limit(page_size)
    )

    return ItemListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            ItemResponse.model_validate(x)
            for x in result.scalars().all()
        ],
    )


@router.get(
    "/items/{item_id}",
    response_model=ItemResponse,
)
async def item_detail(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return ItemResponse.model_validate(
        await get_item_or_404(
            db,
            item_id,
        )
    )


@router.patch(
    "/items/{item_id}/status",
    response_model=ItemResponse,
)
async def change_status(
    item_id: UUID,
    body: ItemStatusInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    item = await get_item_or_404(
        db,
        item_id,
    )

    if item.status != body.status:
        db.add(
            StatusHistory(
                item_id=item.id,
                changed_by=admin.id,
                previous_status=item.status,
                new_status=body.status,
                note=body.note,
            )
        )

        item.status = body.status

        await db.commit()
        await db.refresh(item)

    return ItemResponse.model_validate(item)


@router.get(
    "/items/{item_id}/matches"
)
async def matches(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    await get_item_or_404(
        db,
        item_id,
    )

    results = (
        await matching_service.find_matches_for_item(
            db,
            item_id,
        )
    )

    return {
        "total": len(results),
        "items": results,
    }



@router.post(
    "/items/{item_id}/matches/{lost_item_id}/send",
    status_code=201,
)
async def send_match(
    item_id: UUID,
    lost_item_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    found = await get_item_or_404(db, item_id)
    lost = await get_item_or_404(db, lost_item_id)

    # Verifica se os objetos são de tipos diferentes.
    if (
        found.type != ItemType.ENCONTRADO
        or lost.type != ItemType.PERDIDO
        or found.id == lost.id
    ):
        raise HTTPException(
            400,
            "Selecione um item encontrado e um perdido",
        )

    # Impede correspondência entre objetos indisponíveis.
    if (
        found.status != ItemStatus.ENCONTRADO
        or lost.status != ItemStatus.PERDIDO
    ):
        raise HTTPException(
            400,
            "Item indisponível para correspondência",
        )

    # A correspondência pode ser enviada manualmente,
    # mesmo que os objetos não tenham sido sugeridos
    # pelo algoritmo de similaridade.

    message = (
        f"O objeto encontrado '{found.title}' pode corresponder "
        f"ao seu item perdido '{lost.title}'. "
        "Confira as informações e solicite a devolução se for seu."
    )

    # Evita o envio repetido da mesma correspondência.
    existing = await db.scalar(
        select(Notification.id).where(
            Notification.user_id == lost.user_id,
            Notification.item_id == lost.id,
            Notification.type == NotificationType.MATCH_FOUND,
            Notification.message == message,
        )
    )

    if existing:
        raise HTTPException(
            409,
            "Correspondência já encaminhada",
        )

    # Notifica o proprietário do objeto perdido.
    db.add(
        Notification(
            user_id=lost.user_id,
            item_id=lost.id,
            title="Possível correspondência",
            message=message,
            type=NotificationType.MATCH_FOUND,
        )
    )

    await db.commit()

    return {
        "message": "Correspondência enviada ao usuário"
    }


@router.get("/claims")
async def claims(
    page: int = Query(1, ge=1),
    page_size: int = Query(
        20,
        ge=1,
        le=100,
    ),
    db: AsyncSession = Depends(get_db),
):
    total = (
        await db.scalar(
            select(func.count())
            .select_from(Claim)
        )
        or 0
    )

    result = await db.execute(
        select(Claim)
        .options(
            selectinload(Claim.requester),
            selectinload(Claim.item),
        )
        .order_by(Claim.created_at.desc())
        .offset(
            (page - 1) * page_size
        )
        .limit(page_size)
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            ClaimDetailResponse.model_validate(x)
            for x in result.scalars().all()
        ],
    }


@router.get("/users")
async def users(
    page: int = Query(1, ge=1),
    page_size: int = Query(
        20,
        ge=1,
        le=100,
    ),
    search: str | None = None,
    active: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    filters = (
        [
            or_(
                User.name.ilike(
                    f"%{search}%"
                ),
                User.email.ilike(
                    f"%{search}%"
                ),
            )
        ]
        if search
        else []
    )

    if active is not None:
        filters.append(User.is_active == active)

    total = (
        await db.scalar(
            select(func.count())
            .select_from(User)
            .where(*filters)
        )
        or 0
    )

    result = await db.execute(
        select(User)
        .where(*filters)
        .order_by(User.created_at.desc())
        .offset(
            (page - 1) * page_size
        )
        .limit(page_size)
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at,
            }
            for u in result.scalars().all()
        ],
    }


class UserActiveInput(BaseModel):
    is_active: bool


@router.patch("/users/{user_id}")
async def user_status(
    user_id: UUID,
    body: UserActiveInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    user = await db.get(
        User,
        user_id,
    )

    if not user:
        raise HTTPException(
            404,
            "Usuário não encontrado",
        )

    if (
        user.id == admin.id
        and not body.is_active
    ):
        raise HTTPException(
            400,
            "Você não pode desativar a própria conta",
        )

    user.is_active = body.is_active

    await db.commit()

    return {
        "id": user.id,
        "is_active": user.is_active,
    }


@router.get("/categories")
async def admin_categories(
    db: AsyncSession = Depends(get_db),
):
    categories = (
        await db.execute(
            select(Category).order_by(
                Category.name
            )
        )
    ).scalars().all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
        }
        for c in categories
    ]


@router.post(
    "/categories",
    status_code=201,
)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    category = Category(
        **body.model_dump()
    )

    db.add(category)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()

        raise HTTPException(
            409,
            "Categoria já cadastrada",
        )

    await db.refresh(category)

    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
    }


@router.patch(
    "/categories/{category_id}"
)
async def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
):
    category = await db.get(
        Category,
        category_id,
    )

    if not category:
        raise HTTPException(
            404,
            "Categoria não encontrada",
        )

    for key, value in body.model_dump(
        exclude_unset=True
    ).items():
        setattr(
            category,
            key,
            value,
        )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()

        raise HTTPException(
            409,
            "Nome de categoria já utilizado",
        )

    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
    }


@router.delete(
    "/categories/{category_id}",
    status_code=204,
)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
):
    category = await db.get(
        Category,
        category_id,
    )

    if not category:
        raise HTTPException(
            404,
            "Categoria não encontrada",
        )

    if await db.scalar(
        select(Item.id)
        .where(
            Item.category_id == category_id
        )
        .limit(1)
    ):
        raise HTTPException(
            409,
            "Categoria em uso por objetos",
        )

    await db.delete(category)
    await db.commit()


class ReportDecisionInput(BaseModel):
    action: Literal["ARQUIVAR", "REMOVER_PUBLICACAO", "BLOQUEAR_USUARIO"]
    notes: str = Field(..., min_length=10, max_length=500)
    model_config = ConfigDict(str_strip_whitespace=True)

class RemovalInput(BaseModel):
    reason: str = Field(..., min_length=10, max_length=255)
    model_config = ConfigDict(str_strip_whitespace=True)

@router.get("/users/{user_id}")
async def user_detail(user_id: UUID, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Usuário não encontrado")
    return {"id": user.id, "name": user.name, "email": user.email, "phone": user.phone,
        "role": user.role, "is_active": user.is_active, "created_at": user.created_at,
        "total_items": await db.scalar(select(func.count()).select_from(Item).where(Item.user_id == user.id))}

@router.post("/items/{item_id}/remove", response_model=ItemResponse)
async def remove_item(item_id: UUID, body: RemovalInput, db: AsyncSession = Depends(get_db), admin: User = Depends(get_current_admin)):
    await remove_publication(db, item_id, admin, body.reason)
    await db.commit()
    return ItemResponse.model_validate(await get_item_or_404(db, item_id))

@router.get("/reports")
async def reports(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), resolved: bool | None = None, search: str = "", db: AsyncSession = Depends(get_db)):
    filters = [Report.reason.ilike(f"%{search}%")]
    if resolved is not None:
        filters.append(Report.is_resolved == resolved)
    total = await db.scalar(select(func.count()).select_from(Report).where(*filters))
    result = await db.scalars(select(Report).options(selectinload(Report.reporter), selectinload(Report.reported_user), selectinload(Report.reported_item)).where(*filters).order_by(Report.created_at.desc()).offset((page-1)*page_size).limit(page_size))
    return {"total": total, "page": page, "page_size": page_size, "items": [ReportDetailResponse.model_validate(x) for x in result.all()]}

@router.get("/reports/{report_id}", response_model=ReportDetailResponse)
async def report_detail(report_id: UUID, db: AsyncSession = Depends(get_db)):
    report = await db.scalar(select(Report).where(Report.id == report_id).options(selectinload(Report.reporter), selectinload(Report.reported_user), selectinload(Report.reported_item)))
    if not report:
        raise HTTPException(404, "Denúncia não encontrada")
    return ReportDetailResponse.model_validate(report)

@router.patch("/reports/{report_id}/decision", response_model=ReportResponse)
async def report_decision(report_id: UUID, body: ReportDecisionInput, db: AsyncSession = Depends(get_db), admin: User = Depends(get_current_admin)):
    return ReportResponse.model_validate(await decide_report(db, report_id, admin, body.action, body.notes))

@router.patch("/reports/{report_id}/resolve", response_model=ReportResponse)
async def resolve_report(report_id: UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(get_current_admin)):
    return ReportResponse.model_validate(await decide_report(db, report_id, admin, "ARQUIVAR", "Concluída pelo administrador sem sanção."))
