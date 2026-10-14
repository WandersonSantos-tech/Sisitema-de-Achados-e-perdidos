"""Registra o parecer de moderação sem apagar denúncias existentes."""
from alembic import op
import sqlalchemy as sa
revision = "a20261010_moderation"
down_revision = "0876953b3b91"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("reports", sa.Column("resolution_action", sa.String(30), nullable=True))
    op.add_column("reports", sa.Column("resolution_notes", sa.Text(), nullable=True))
    op.add_column("reports", sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("reports", sa.Column("resolved_by", sa.UUID(), nullable=True))
    op.create_foreign_key("fk_reports_resolved_by", "reports", "users", ["resolved_by"], ["id"], ondelete="SET NULL")

def downgrade():
    op.drop_constraint("fk_reports_resolved_by", "reports", type_="foreignkey")
    for name in ["resolved_by", "resolved_at", "resolution_notes", "resolution_action"]:
        op.drop_column("reports", name)
