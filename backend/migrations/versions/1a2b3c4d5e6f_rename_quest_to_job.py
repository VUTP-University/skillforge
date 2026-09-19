"""rename quest to job across all tables/columns/enum

Revision ID: 1a2b3c4d5e6f
Revises: a1b2c3d4e5f6
Create Date: 2026-08-01 00:00:00.000000

"""
from alembic import op


revision = '1a2b3c4d5e6f'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE difficulty RENAME TO job_difficulty")
    op.execute("ALTER TYPE job_difficulty RENAME VALUE 'shallow' TO 'junior'")
    op.execute("ALTER TYPE job_difficulty RENAME VALUE 'cryptic' TO 'mid'")
    op.execute("ALTER TYPE job_difficulty RENAME VALUE 'abyssal' TO 'senior'")

    op.rename_table('quests', 'jobs')
    op.rename_table('quest_comments', 'job_comments')
    op.rename_table('quest_completions', 'job_completions')
    op.rename_table('quest_submissions', 'job_submissions')
    op.rename_table('quest_reports', 'job_reports')

    op.alter_column('job_comments', 'quest_id', new_column_name='job_id')
    op.alter_column('job_completions', 'quest_id', new_column_name='job_id')
    op.alter_column('job_submissions', 'quest_id', new_column_name='job_id')
    op.alter_column('job_reports', 'quest_id', new_column_name='job_id')
    op.alter_column('test_cases', 'quest_id', new_column_name='job_id')

    op.execute("ALTER TABLE job_completions RENAME CONSTRAINT uq_user_quest_completion TO uq_user_job_completion")
    op.execute("ALTER TABLE test_cases RENAME CONSTRAINT uq_quest_testcase_index TO uq_job_testcase_index")

    op.execute("ALTER INDEX ix_quest_submissions_user_id RENAME TO ix_job_submissions_user_id")
    op.execute("ALTER INDEX ix_quest_submissions_quest_id RENAME TO ix_job_submissions_job_id")
    op.execute("ALTER INDEX ix_quest_submissions_submitted_at RENAME TO ix_job_submissions_submitted_at")
    op.execute("ALTER INDEX ix_quest_reports_quest_id RENAME TO ix_job_reports_job_id")


def downgrade():
    op.execute("ALTER INDEX ix_job_reports_job_id RENAME TO ix_quest_reports_quest_id")
    op.execute("ALTER INDEX ix_job_submissions_submitted_at RENAME TO ix_quest_submissions_submitted_at")
    op.execute("ALTER INDEX ix_job_submissions_job_id RENAME TO ix_quest_submissions_quest_id")
    op.execute("ALTER INDEX ix_job_submissions_user_id RENAME TO ix_quest_submissions_user_id")

    op.execute("ALTER TABLE test_cases RENAME CONSTRAINT uq_job_testcase_index TO uq_quest_testcase_index")
    op.execute("ALTER TABLE job_completions RENAME CONSTRAINT uq_user_job_completion TO uq_user_quest_completion")

    op.alter_column('test_cases', 'job_id', new_column_name='quest_id')
    op.alter_column('job_reports', 'job_id', new_column_name='quest_id')
    op.alter_column('job_submissions', 'job_id', new_column_name='quest_id')
    op.alter_column('job_completions', 'job_id', new_column_name='quest_id')
    op.alter_column('job_comments', 'job_id', new_column_name='quest_id')

    op.rename_table('job_reports', 'quest_reports')
    op.rename_table('job_submissions', 'quest_submissions')
    op.rename_table('job_completions', 'quest_completions')
    op.rename_table('job_comments', 'quest_comments')
    op.rename_table('jobs', 'quests')

    op.execute("ALTER TYPE job_difficulty RENAME VALUE 'senior' TO 'abyssal'")
    op.execute("ALTER TYPE job_difficulty RENAME VALUE 'mid' TO 'cryptic'")
    op.execute("ALTER TYPE job_difficulty RENAME VALUE 'junior' TO 'shallow'")
    op.execute("ALTER TYPE job_difficulty RENAME TO difficulty")
