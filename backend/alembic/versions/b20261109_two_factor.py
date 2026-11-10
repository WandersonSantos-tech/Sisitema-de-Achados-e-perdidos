"""Adiciona suporte a autenticação em dois fatores (2FA) por usuário."""

from alembic import op
import sqlalchemy as sa


revision = "b20261109_two_factor"
down_revision = "a20261024_cpf_users"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("two_factor_secret", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "is_two_factor_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade():
    op.drop_column("users", "is_two_factor_enabled")
    op.drop_column("users", "two_factor_secret")
