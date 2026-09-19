"""add fail_token to process_challenges

Revision ID: 9d1c2e3f4a5b
Revises: 284b442b7e2c
Create Date: 2026-09-19 00:00:00.000000

"""
import secrets

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9d1c2e3f4a5b'
down_revision = '284b442b7e2c'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('process_challenges', schema=None) as batch_op:
        batch_op.add_column(sa.Column('fail_token', sa.String(length=43), nullable=True))

    # Backfill existing rows with a random token, then enforce NOT NULL.
    connection = op.get_bind()
    challenges = connection.execute(sa.text('SELECT id FROM process_challenges')).fetchall()
    for (challenge_id,) in challenges:
        connection.execute(
            sa.text('UPDATE process_challenges SET fail_token = :token WHERE id = :id'),
            {'token': secrets.token_urlsafe(32), 'id': challenge_id},
        )

    with op.batch_alter_table('process_challenges', schema=None) as batch_op:
        batch_op.alter_column('fail_token', existing_type=sa.String(length=43), nullable=False)


def downgrade():
    with op.batch_alter_table('process_challenges', schema=None) as batch_op:
        batch_op.drop_column('fail_token')
