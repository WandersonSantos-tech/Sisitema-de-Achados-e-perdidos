"""Operações de moderação com decisão e alterações na mesma transação."""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import select
from app.models.enums import ItemStatus
from app.models.item import Item
from app.models.status_history import StatusHistory
from app.models.user import User

async def remove_publication(db, item_id, admin, note):
    item = await db.scalar(select(Item).where(Item.id == item_id).with_for_update())
    if not item:
        raise HTTPException(404, "Publicação não encontrada")
    if item.status != ItemStatus.CANCELADO:
        db.add(StatusHistory(item_id=item.id, changed_by=admin.id,
            previous_status=item.status, new_status=ItemStatus.CANCELADO, note=note[:255]))
        item.status = ItemStatus.CANCELADO
    return item

