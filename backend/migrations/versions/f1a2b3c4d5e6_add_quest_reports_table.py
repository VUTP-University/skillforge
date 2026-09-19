"""add quest_reports table

Revision ID: f1a2b3c4d5e6
Revises: e5f6a7b8c9d0
Create Date: 2026-07-07 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision    = 'f1a2b3c4d5e6'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on    = None


def upgrade():
    op.create_table(
        'quest_reports',
        sa.Column('id',             sa.Integer(),    nullable=False),
        sa.Column('quest_id',       sa.Integer(),    nullable=False),
        sa.Column('reporter_id',    sa.Integer(),    nullable=False),
        sa.Column('reason',         sa.Text(),       nullable=False),
        sa.Column('status',         sa.Enum('reported', 'in_progress', 'solved', name='reportstatus'), nullable=False, server_default='reported'),
        sa.Column('assigned_to_id', sa.Integer(),    nullable=True),
        sa.Column('created_at',     sa.DateTime(),   nullable=False),
        sa.Column('updated_at',     sa.DateTime(),   nullable=False),
        sa.ForeignKeyConstraint(['quest_id'],       ['quests.id'],  ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reporter_id'],    ['users.id'],   ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'],   ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_quest_reports_quest_id', 'quest_reports', ['quest_id'])


def downgrade():
    op.drop_index('ix_quest_reports_quest_id', table_name='quest_reports')
    op.drop_table('quest_reports')
    op.execute("DROP TYPE IF EXISTS reportstatus")
