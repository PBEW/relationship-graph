"""initial schema

Revision ID: 4c948b14b747
Revises:
Create Date: 2026-08-04 20:26:17.009778

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4c948b14b747'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'people',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('avatar', sa.String(length=500), nullable=True),
        sa.Column('display_name', sa.String(length=120), nullable=False),
        sa.Column('nickname', sa.String(length=120), nullable=True),
        sa.Column('vrchat_name', sa.String(length=120), nullable=True),
        sa.Column('discord', sa.String(length=120), nullable=True),
        sa.Column('steam', sa.String(length=120), nullable=True),
        sa.Column('twitter', sa.String(length=120), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('birthday', sa.Date(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "gender IN ('male','female','non_binary','other','unspecified')",
            name='ck_person_gender_valid',
        ),
    )
    op.create_index('ix_people_display_name', 'people', ['display_name'])
    op.create_index('ix_people_nickname', 'people', ['nickname'])
    op.create_index('ix_people_vrchat_name', 'people', ['vrchat_name'])
    op.create_index('ix_people_discord', 'people', ['discord'])
    op.create_index('ix_people_steam', 'people', ['steam'])
    op.create_index('ix_people_twitter', 'people', ['twitter'])
    op.create_index('ix_people_country', 'people', ['country'])
    op.create_index('ix_people_gender', 'people', ['gender'])

    op.create_table(
        'relationship_types',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=False),
        sa.Column('icon', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.CheckConstraint(
            "color ~ '^#[0-9A-Fa-f]{6}$'", name='ck_relationship_type_color_hex'
        ),
        sa.UniqueConstraint('name', name='uq_relationship_types_name'),
    )

    op.create_table(
        'relationships',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('person_a_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('person_b_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('relationship_type_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ['person_a_id'], ['people.id'], name='fk_relationships_person_a', ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['person_b_id'], ['people.id'], name='fk_relationships_person_b', ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['relationship_type_id'],
            ['relationship_types.id'],
            name='fk_relationships_type',
            ondelete='RESTRICT',
        ),
        sa.CheckConstraint('person_a_id <> person_b_id', name='ck_relationship_not_self'),
        sa.CheckConstraint("status IN ('active','ended')", name='ck_relationship_status_valid'),
        sa.CheckConstraint(
            'end_date IS NULL OR start_date IS NULL OR end_date >= start_date',
            name='ck_relationship_date_order',
        ),
    )
    op.create_index('ix_relationships_person_a', 'relationships', ['person_a_id'])
    op.create_index('ix_relationships_person_b', 'relationships', ['person_b_id'])
    op.create_index('ix_relationships_pair', 'relationships', ['person_a_id', 'person_b_id'])
    op.create_index('ix_relationships_type', 'relationships', ['relationship_type_id'])
    op.create_index('ix_relationships_status', 'relationships', ['status'])


def downgrade():
    op.drop_table('relationships')
    op.drop_table('relationship_types')
    op.drop_table('people')
