"""rename difficulty enum values shallow/cryptic/abyssal

Revision ID: 3f1a9c82b04e
Revises: 268a67d63e2f
Create Date: 2026-05-25
"""
from alembic import op

revision = "3f1a9c82b04e"
down_revision = "268a67d63e2f"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE difficulty RENAME VALUE 'initiate' TO 'shallow'")
    op.execute("ALTER TYPE difficulty RENAME VALUE 'adept'    TO 'cryptic'")
    op.execute("ALTER TYPE difficulty RENAME VALUE 'archmage' TO 'abyssal'")


def downgrade():
    op.execute("ALTER TYPE difficulty RENAME VALUE 'shallow' TO 'initiate'")
    op.execute("ALTER TYPE difficulty RENAME VALUE 'cryptic' TO 'adept'")
    op.execute("ALTER TYPE difficulty RENAME VALUE 'abyssal' TO 'archmage'")
