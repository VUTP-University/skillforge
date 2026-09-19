"""drop achievements.is_secret column

Revision ID: c015f7951164
Revises: de80707a2e50
Create Date: 2026-08-01 21:00:00.154977

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c015f7951164'
down_revision = 'de80707a2e50'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('achievements', schema=None) as batch_op:
        batch_op.drop_column('is_secret')
    # NOTE: autogenerate also proposed dropping ix_test_runs_user_id again —
    # same pre-existing unrelated drift noted in 63d38862ecae, left alone.


def downgrade():
    with op.batch_alter_table('achievements', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_secret', sa.BOOLEAN(), autoincrement=False, nullable=False, server_default=sa.false()))
