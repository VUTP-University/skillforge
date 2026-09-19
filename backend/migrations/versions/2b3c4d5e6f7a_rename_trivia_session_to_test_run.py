"""rename trivia_sessions to test_runs

Revision ID: 2b3c4d5e6f7a
Revises: 1a2b3c4d5e6f
Create Date: 2026-08-01 00:05:00.000000

"""
from alembic import op


revision = '2b3c4d5e6f7a'
down_revision = '1a2b3c4d5e6f'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE triviasessionstatus RENAME TO test_run_status")
    op.rename_table('trivia_sessions', 'test_runs')
    op.execute("ALTER INDEX ix_trivia_sessions_user_id RENAME TO ix_test_runs_user_id")


def downgrade():
    op.execute("ALTER INDEX ix_test_runs_user_id RENAME TO ix_trivia_sessions_user_id")
    op.rename_table('test_runs', 'trivia_sessions')
    op.execute("ALTER TYPE test_run_status RENAME TO triviasessionstatus")
