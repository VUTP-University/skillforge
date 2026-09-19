"""rename boss to process

Revision ID: 3c4d5e6f7a8b
Revises: 2b3c4d5e6f7a
Create Date: 2026-08-01 00:10:00.000000

"""
from alembic import op


revision = '3c4d5e6f7a8b'
down_revision = '2b3c4d5e6f7a'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE bossdifficulty RENAME TO process_severity")

    op.rename_table('bosses', 'processes')
    op.rename_table('boss_challenges', 'process_challenges')

    op.alter_column('process_challenges', 'boss_id', new_column_name='process_id')
    op.alter_column('process_challenges', 'boss_taunt', new_column_name='process_taunt')
    op.alter_column('process_challenges', 'boss_verdict', new_column_name='process_verdict')


def downgrade():
    op.alter_column('process_challenges', 'process_verdict', new_column_name='boss_verdict')
    op.alter_column('process_challenges', 'process_taunt', new_column_name='boss_taunt')
    op.alter_column('process_challenges', 'process_id', new_column_name='boss_id')

    op.rename_table('process_challenges', 'boss_challenges')
    op.rename_table('processes', 'bosses')

    op.execute("ALTER TYPE process_severity RENAME TO bossdifficulty")
