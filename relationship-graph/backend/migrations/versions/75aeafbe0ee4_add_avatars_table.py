"""add avatars table

Moves uploaded profile images off the filesystem and into the database, so
they survive deploys on hosts without a persistent disk.

Existing `people.avatar` values pointing at the old `/uploads/...` route are
left as-is: the files they referenced are already gone on such a host, and
blanking them would throw away perfectly good records on one that kept them.
The app falls back to initials whenever an avatar fails to load.

Revision ID: 75aeafbe0ee4
Revises: 5490fe2cba1e
Create Date: 2026-08-09 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '75aeafbe0ee4'
down_revision = '5490fe2cba1e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'avatars',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('mimetype', sa.String(length=50), nullable=False),
        sa.Column('data', sa.LargeBinary(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade():
    op.drop_table('avatars')
