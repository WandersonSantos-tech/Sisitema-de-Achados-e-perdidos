"""Operações de moderação com decisão e alterações na mesma transação."""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import select
from app.models.enums import ItemStatus
from app.models.item import Item
from app.models.report import Report
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

async def decide_report(db, report_id, admin, action, notes):
    report = await db.scalar(select(Report).where(Report.id == report_id).with_for_update())
    if not report:
        raise HTTPException(404, "Denúncia não encontrada")
    if report.is_resolved:
        raise HTTPException(409, "Esta denúncia já foi analisada")
    if action == "REMOVER_PUBLICACAO":
        if not report.reported_item_id:
            raise HTTPException(400, "A denúncia não possui uma publicação vinculada")
        await remove_publication(db, report.reported_item_id, admin, notes)
    elif action == "BLOQUEAR_USUARIO":
        user_id = report.reported_user_id
        if not user_id and report.reported_item_id:
            item = await db.get(Item, report.reported_item_id)
            user_id = item.user_id if item else None
        user = await db.get(User, user_id) if user_id else None
        if not user:
            raise HTTPException(400, "A denúncia não possui um usuário disponível")
        if user.id == admin.id:
            raise HTTPException(400, "Você não pode bloquear a própria conta")
        user.is_active = False
    report.is_resolved = True
    report.resolution_action = action
    report.resolution_notes = notes
    report.resolved_by = admin.id
    report.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    return report
