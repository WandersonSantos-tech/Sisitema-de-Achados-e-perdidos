
"""Create push devices table for Android notifications."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "d20261120_push_devices"
down_revision = "c20261114_auth"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "push_devices",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "expo_push_token",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "platform",
            sa.String(length=20),
            nullable=False,
            server_default="android",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "expo_push_token",
            name="uq_push_devices_expo_push_token",
        ),
    )

    op.create_index(
        "ix_push_devices_user_id",
        "push_devices",
        ["user_id"],
    )


def downgrade():
    op.drop_index(
        "ix_push_devices_user_id",
        table_name="push_devices",
    )

    op.drop_table("push_devices")
