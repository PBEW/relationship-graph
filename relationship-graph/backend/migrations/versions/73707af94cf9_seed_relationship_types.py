"""seed relationship types

Revision ID: 73707af94cf9
Revises: 4c948b14b747
Create Date: 2026-08-04 20:26:46.815180

"""
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '73707af94cf9'
down_revision = '4c948b14b747'
branch_labels = None
depends_on = None


relationship_types_table = sa.table(
    'relationship_types',
    sa.column('id', postgresql.UUID(as_uuid=True)),
    sa.column('name', sa.String),
    sa.column('color', sa.String),
    sa.column('icon', sa.String),
    sa.column('description', sa.Text),
)

RELATIONSHIP_TYPES = [
    {
        'name': 'Friend',
        'color': '#06B6D4',
        'icon': 'users',
        'description': 'Friendly acquaintances who hang out regularly.',
    },
    {
        'name': 'Sibling',
        'color': '#6366F1',
        'icon': 'users-round',
        'description': 'Treats each other like a brother/sister figure.',
    },
    {
        'name': 'Dating',
        'color': '#EC4899',
        'icon': 'heart',
        'description': 'Currently in a romantic relationship.',
    },
    {
        'name': 'Married',
        'color': '#F43F5E',
        'icon': 'gem',
        'description': 'In-community marriage/committed partnership.',
    },
    {
        'name': 'Partner',
        'color': '#A855F7',
        'icon': 'handshake',
        'description': 'A close, trusted partner (business, creative, or personal).',
    },
    {
        'name': 'Ex',
        'color': '#F97316',
        'icon': 'heart-crack',
        'description': 'Formerly dating/married; the relationship has ended.',
    },
    {
        'name': 'Enemy',
        'color': '#DC2626',
        'icon': 'swords',
        'description': 'Actively hostile or conflicting relationship.',
    },
    {
        'name': 'Blocked',
        'color': '#171717',
        'icon': 'ban',
        'description': 'One person has blocked the other.',
    },
    {
        'name': 'Muted',
        'color': '#64748B',
        'icon': 'mic-off',
        'description': 'One person has muted the other.',
    },
    {
        'name': 'Guild',
        'color': '#16A34A',
        'icon': 'shield',
        'description': 'Members of the same guild/group/clan.',
    },
    {
        'name': 'Family',
        'color': '#0EA5E9',
        'icon': 'home',
        'description': 'Treats each other as chosen family.',
    },
    {
        'name': 'Favorite',
        'color': '#EAB308',
        'icon': 'star',
        'description': 'A favorite / especially close connection.',
    },
]


def upgrade():
    op.bulk_insert(
        relationship_types_table,
        [{**rt, 'id': uuid.uuid4()} for rt in RELATIONSHIP_TYPES],
    )


def downgrade():
    names = [rt['name'] for rt in RELATIONSHIP_TYPES]
    conn = op.get_bind()
    conn.execute(
        relationship_types_table.delete().where(relationship_types_table.c.name.in_(names))
    )
