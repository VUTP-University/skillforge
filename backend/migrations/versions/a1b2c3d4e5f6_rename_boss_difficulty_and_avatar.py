"""rename boss difficulty tiers and avatar column to glyph

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-07-31 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    # Underworld -> The Stack Trace: bosses are no longer "cursed/damned/infernal"
    # demons, they're hostile processes at escalating severity.
    op.execute("ALTER TYPE bossdifficulty RENAME VALUE 'cursed' TO 'warning'")
    op.execute("ALTER TYPE bossdifficulty RENAME VALUE 'damned' TO 'critical'")
    op.execute("ALTER TYPE bossdifficulty RENAME VALUE 'infernal' TO 'fatal'")

    # Portrait art is being dropped in favor of a CSS-rendered terminal glyph.
    op.alter_column('bosses', 'avatar', new_column_name='glyph')


def downgrade():
    op.alter_column('bosses', 'glyph', new_column_name='avatar')

    op.execute("ALTER TYPE bossdifficulty RENAME VALUE 'fatal' TO 'infernal'")
    op.execute("ALTER TYPE bossdifficulty RENAME VALUE 'critical' TO 'damned'")
    op.execute("ALTER TYPE bossdifficulty RENAME VALUE 'warning' TO 'cursed'")
