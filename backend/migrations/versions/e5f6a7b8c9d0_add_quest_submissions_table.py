"""add quest_submissions table and revert quest_completions solution columns

Revision ID: e5f6a7b8c9d0
Revises: d1e2f3a4b5c6
Create Date: 2026-06-07 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'e5f6a7b8c9d0'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade():
    # Remove the short-lived columns from quest_completions
    op.drop_column('quest_completions', 'solution_code')
    op.drop_column('quest_completions', 'test_results')

    # Create the proper all-submissions table
    op.create_table(
        'quest_submissions',
        sa.Column('id',            sa.Integer(),  nullable=False),
        sa.Column('user_id',       sa.Integer(),  nullable=False),
        sa.Column('quest_id',      sa.Integer(),  nullable=False),
        sa.Column('solution_code', sa.Text(),     nullable=False),
        sa.Column('test_results',  sa.JSON(),     nullable=True),
        sa.Column('all_passed',    sa.Boolean(),  nullable=False, server_default=sa.false()),
        sa.Column('submitted_at',  sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'],  ['users.id'],  ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['quest_id'], ['quests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_quest_submissions_user_id',      'quest_submissions', ['user_id'])
    op.create_index('ix_quest_submissions_quest_id',     'quest_submissions', ['quest_id'])
    op.create_index('ix_quest_submissions_submitted_at', 'quest_submissions', ['submitted_at'])


def downgrade():
    op.drop_index('ix_quest_submissions_submitted_at', table_name='quest_submissions')
    op.drop_index('ix_quest_submissions_quest_id',     table_name='quest_submissions')
    op.drop_index('ix_quest_submissions_user_id',      table_name='quest_submissions')
    op.drop_table('quest_submissions')
    op.add_column('quest_completions', sa.Column('solution_code', sa.Text(),  nullable=True))
    op.add_column('quest_completions', sa.Column('test_results',  sa.JSON(),  nullable=True))
