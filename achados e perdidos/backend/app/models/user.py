from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.claim import Claim
    from app.models.item import Item
    from app.models.message import Message
    from app.models.notification import Notification
    from app.models.report import Report
    from app.models.review import Review
    from app.models.status_history import StatusHistory


class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_email", "email", unique=True),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(
        String(150), nullable=False, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        sa.Enum(UserRole, name="user_role", native_enum=True,
                create_constraint=True, validate_strings=True),
        default=UserRole.USER,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False)

    items: Mapped[list[Item]] = relationship(
        back_populates="user", cascade="all, delete-orphan")
    claims: Mapped[list[Claim]] = relationship(back_populates="requester")
    sent_messages: Mapped[list[Message]] = relationship(
        back_populates="sender",
        foreign_keys="Message.sender_id",
    )
    received_messages: Mapped[list[Message]] = relationship(
        back_populates="receiver",
        foreign_keys="Message.receiver_id",
    )
    notifications: Mapped[list[Notification]
                          ] = relationship(back_populates="user")
    status_history: Mapped[list[StatusHistory]] = relationship(
        back_populates="changed_by_user",
        foreign_keys="StatusHistory.changed_by",
    )
    reviews_written: Mapped[list[Review]] = relationship(
        back_populates="reviewer",
        foreign_keys="Review.reviewer_id",
    )
    reviews_received: Mapped[list[Review]] = relationship(
        back_populates="reviewed_user",
        foreign_keys="Review.reviewed_user_id",
    )
    reports_submitted: Mapped[list[Report]] = relationship(
        back_populates="reporter",
        foreign_keys="Report.reporter_id",
    )
    reports_about_user: Mapped[list[Report]] = relationship(
        back_populates="reported_user",
        foreign_keys="Report.reported_user_id",
    )
