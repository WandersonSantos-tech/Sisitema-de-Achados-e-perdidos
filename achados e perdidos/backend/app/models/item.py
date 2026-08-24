from __future__ import annotations

from datetime import datetime
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import ItemStatus, ItemType

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.claim import Claim
    from app.models.item_image import ItemImage
    from app.models.message import Message
    from app.models.notification import Notification
    from app.models.report import Report
    from app.models.review import Review
    from app.models.status_history import StatusHistory
    from app.models.user import User


class Item(Base, TimestampMixin):
    __tablename__ = "items"
    __table_args__ = (
        Index("ix_items_title", "title"),
        Index("ix_items_status", "status"),
        Index("ix_items_event_date", "event_date"),
        Index("ix_items_category_id", "category_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    type: Mapped[ItemType] = mapped_column(
        sa.Enum(ItemType, name="item_type", native_enum=True,
                create_constraint=True, validate_strings=True),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    secret_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    location_name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(
        Numeric(9, 6), nullable=True)
    event_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    status: Mapped[ItemStatus] = mapped_column(
        sa.Enum(ItemStatus, name="item_status", native_enum=True,
                create_constraint=True, validate_strings=True),
        default=ItemStatus.PERDIDO,
        nullable=False,
        index=True,
    )

    user: Mapped[User] = relationship(back_populates="items")
    category: Mapped[Category] = relationship(back_populates="items")
    images: Mapped[list[ItemImage]] = relationship(
        back_populates="item", cascade="all, delete-orphan")
    claims: Mapped[list[Claim]] = relationship(
        back_populates="item", cascade="all, delete-orphan")
    status_history: Mapped[list[StatusHistory]] = relationship(
        back_populates="item",
        cascade="all, delete-orphan",
    )
    notifications: Mapped[list[Notification]
                          ] = relationship(back_populates="item")
    messages: Mapped[list[Message]] = relationship(
        back_populates="item", cascade="all, delete-orphan")
    reviews: Mapped[list[Review]] = relationship(back_populates="item")
    reports: Mapped[list[Report]] = relationship(
        back_populates="reported_item")
