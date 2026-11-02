
from __future__ import annotations

import uuid
import sqlalchemy as sa

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class MatchDispatch(Base, TimestampMixin):
    """Registra correspondências enviadas pela equipe."""

    __tablename__ = "match_dispatches"

    __table_args__ = (
        sa.UniqueConstraint(
            "found_item_id",
            "lost_item_id",
            name="uq_match_dispatch_pair",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    found_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    lost_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sent_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    similarity_score: Mapped[float] = mapped_column(
        sa.Float,
        nullable=False,
        default=0.0,
    )

    is_manual: Mapped[bool] = mapped_column(
        sa.Boolean,
        nullable=False,
        default=True,
    )
