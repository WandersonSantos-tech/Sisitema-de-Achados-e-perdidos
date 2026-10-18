"""Perfis, origem imutável e responsável da correspondência. Preserva denúncias históricas."""
from alembic import op
import sqlalchemy as sa
revision = "a20261017_flow"
down_revision = "a20261010_moderation"
branch_labels = None
depends_on = None

def upgrade():
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'COLABORADOR'")
        op.execute("ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'CORRESPONDENCIA'")
    op.add_column("items", sa.Column("internal_origin", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.execute("UPDATE items SET internal_origin = true FROM users WHERE users.id = items.user_id AND users.role::text IN ('ADMIN', 'COLABORADOR')")
    op.add_column("claims", sa.Column("responsible_id", sa.UUID(), nullable=True))
    op.create_foreign_key("fk_claim_responsible", "claims", "users", ["responsible_id"], ["id"], ondelete="SET NULL")

    op.add_column("claims", sa.Column("pickup_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("claims", sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("claims", sa.Column("signature", sa.Text(), nullable=True))

def downgrade():
    for column in ("signature", "returned_at", "pickup_at"):
        op.drop_column("claims", column)
    op.drop_constraint("fk_claim_responsible", "claims", type_="foreignkey")
    op.drop_column("claims", "responsible_id")
    op.drop_column("items", "internal_origin")
