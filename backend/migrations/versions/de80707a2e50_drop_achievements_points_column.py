"""drop achievements.points column

Revision ID: de80707a2e50
Revises: 63d38862ecae
Create Date: 2026-08-01 20:56:52.312711

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'de80707a2e50'
down_revision = '63d38862ecae'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('achievements', schema=None) as batch_op:
        batch_op.drop_column('points')
    # NOTE: autogenerate also proposed dropping ix_test_runs_user_id again —
    # same pre-existing unrelated drift noted in 63d38862ecae, left alone.


def downgrade():
    with op.batch_alter_table('achievements', schema=None) as batch_op:
        batch_op.add_column(sa.Column('points', sa.INTEGER(), autoincrement=False, nullable=False, server_default='10'))
