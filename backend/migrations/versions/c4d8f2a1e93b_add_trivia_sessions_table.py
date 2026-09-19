"""add trivia_sessions table

Revision ID: c4d8f2a1e93b
Revises: b7f3e1c9d24a
Create Date: 2026-06-07 00:01:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4d8f2a1e93b'
down_revision = 'b7f3e1c9d24a'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'trivia_sessions',
        sa.Column('id',            sa.Integer(),  nullable=False),
        sa.Column('user_id',       sa.Integer(),  nullable=False),
        sa.Column('language',      sa.String(20), nullable=False),
        sa.Column('status',        sa.Enum('active', 'completed', 'expired', name='triviasessionstatus'), nullable=False),
        sa.Column('questions',     sa.JSON(),     nullable=False),
        sa.Column('score_xp',      sa.Integer(),  nullable=False, server_default='0'),
        sa.Column('correct_count', sa.Integer(),  nullable=False, server_default='0'),
        sa.Column('started_at',    sa.DateTime(), nullable=False),
        sa.Column('expires_at',    sa.DateTime(), nullable=False),
        sa.Column('completed_at',  sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_trivia_sessions_user_id', 'trivia_sessions', ['user_id'])


def downgrade():
    op.drop_index('ix_trivia_sessions_user_id', table_name='trivia_sessions')
    op.drop_table('trivia_sessions')
    op.execute("DROP TYPE IF EXISTS triviasessionstatus")
