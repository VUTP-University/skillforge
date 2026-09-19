"""add ban fields to users

Revision ID: a3b4c5d6e7f8
Revises: c015f7951164
Create Date: 2026-08-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3b4c5d6e7f8'
down_revision = 'c015f7951164'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_banned', sa.Boolean(), nullable=False, server_default='false'))
        batch_op.add_column(sa.Column('ban_reason', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('banned_at', sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('banned_at')
        batch_op.drop_column('ban_reason')
        batch_op.drop_column('is_banned')
