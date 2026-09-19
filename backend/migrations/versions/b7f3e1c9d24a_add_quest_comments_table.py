"""add quest_comments table

Revision ID: b7f3e1c9d24a
Revises: 96bb92136a5e
Create Date: 2026-06-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7f3e1c9d24a'
down_revision = '96bb92136a5e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'quest_comments',
        sa.Column('id',         sa.Integer(),  nullable=False),
        sa.Column('quest_id',   sa.Integer(),  nullable=False),
        sa.Column('user_id',    sa.Integer(),  nullable=False),
        sa.Column('content',    sa.Text(),     nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['quest_id'], ['quests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'],  ['users.id'],  ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('quest_comments')
