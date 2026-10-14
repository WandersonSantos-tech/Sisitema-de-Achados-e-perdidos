from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import ItemStatus

if TYPE_CHECKING:
    from app.models.item import Item
    from app.models.user import User


class StatusHistory(Base, TimestampMixin):
    __tablename__ = "status_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    changed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    previous_status: Mapped[ItemStatus | None] = mapped_column(
        sa.Enum(ItemStatus, name="item_status", native_enum=True,
                create_constraint=True, validate_strings=True),
        nullable=True,
    )
    new_status: Mapped[ItemStatus] = mapped_column(
        sa.Enum(ItemStatus, name="item_status", native_enum=True,
                create_constraint=True, validate_strings=True),
        nullable=False,
    )
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)

    item: Mapped[Item] = relationship(back_populates="status_history")
    changed_by_user: Mapped[User | None] = relationship(
        back_populates="status_history",
        foreign_keys="StatusHistory.changed_by",
    )
