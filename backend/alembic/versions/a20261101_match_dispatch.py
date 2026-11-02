
"""Registra correspondências encaminhadas pela equipe."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = "a20261101_match_dispatch"
down_revision = "a20261024_cpf_users"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "match_dispatches",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "found_item_id",
            UUID(as_uuid=True),
            sa.ForeignKey("items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "lost_item_id",
            UUID(as_uuid=True),
            sa.ForeignKey("items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "recipient_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "sent_by_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "similarity_score",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "is_manual",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "found_item_id",
            "lost_item_id",
            name="uq_match_dispatch_pair",
        ),
    )

    op.create_index(
        "ix_match_dispatches_found_item_id",
        "match_dispatches",
        ["found_item_id"],
    )

    op.create_index(
        "ix_match_dispatches_lost_item_id",
        "match_dispatches",
        ["lost_item_id"],
    )

    op.create_index(
        "ix_match_dispatches_recipient_id",
        "match_dispatches",
        ["recipient_id"],
    )


def downgrade():
    op.drop_table("match_dispatches")
