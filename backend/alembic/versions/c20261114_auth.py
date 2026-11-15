"""Merge existing heads and persist single-use authentication state."""
from alembic import op
import sqlalchemy as sa

revision = "c20261114_auth"
down_revision = ("b20261109_two_factor", "a20261101_match_dispatch")
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("two_factor_challenge", sa.String(64)))
    op.add_column("users", sa.Column("two_factor_setup_expires", sa.Float()))
    op.add_column("users", sa.Column("password_reset_digest", sa.String(64)))
    op.add_column("users", sa.Column("password_reset_expires", sa.Float()))
    op.add_column("users", sa.Column("two_factor_last_step", sa.BigInteger()))
    # Encrypt existing secrets without changing activation or deleting accounts.
    from app.core.config import settings
    from cryptography.fernet import Fernet
    users = sa.table("users", sa.column("id"), sa.column("two_factor_secret"))
    connection = op.get_bind()
    rows = connection.execute(sa.select(users.c.id, users.c.two_factor_secret).where(
        users.c.two_factor_secret.is_not(None), ~users.c.two_factor_secret.like("enc:%")))
    for user_id, secret in rows:
        if not settings.TWO_FACTOR_ENCRYPTION_KEY:
            raise RuntimeError("Configure TWO_FACTOR_ENCRYPTION_KEY antes de migrar segredos existentes")
        encrypted = "enc:" + Fernet(settings.TWO_FACTOR_ENCRYPTION_KEY.encode()).encrypt(secret.encode()).decode()
        connection.execute(users.update().where(users.c.id == user_id).values(two_factor_secret=encrypted))


def downgrade():
    op.drop_column("users", "two_factor_challenge")
    op.drop_column("users", "two_factor_setup_expires")
    op.drop_column("users", "two_factor_last_step")
    op.drop_column("users", "password_reset_expires")
    op.drop_column("users", "password_reset_digest")
