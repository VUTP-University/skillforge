"""add solution_code and test_results to quest_completions

Revision ID: d1e2f3a4b5c6
Revises: c4d8f2a1e93b
Create Date: 2026-06-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'd1e2f3a4b5c6'
down_revision = 'c4d8f2a1e93b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('quest_completions', sa.Column('solution_code', sa.Text(), nullable=True))
    op.add_column('quest_completions', sa.Column('test_results', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('quest_completions', 'test_results')
    op.drop_column('quest_completions', 'solution_code')
