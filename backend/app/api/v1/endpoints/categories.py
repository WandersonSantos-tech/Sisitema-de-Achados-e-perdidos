from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.item import CategoryResponse

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    result = await db.execute(
        select(Category).order_by(Category.name.asc())
    )

    categories = result.scalars().all()

    return [
        CategoryResponse.model_validate(category)
        for category in categories
    ]