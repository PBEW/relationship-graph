"""add users table

Revision ID: 5490fe2cba1e
Revises: 73707af94cf9
Create Date: 2026-08-05 10:00:00.000000

"""
import os
import uuid
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from werkzeug.security import generate_password_hash

# revision identifiers, used by Alembic.
revision = '5490fe2cba1e'
down_revision = '73707af94cf9'
branch_labels = None
depends_on = None


users_table = sa.table(
    'users',
    sa.column('id', postgresql.UUID(as_uuid=True)),
    sa.column('username', sa.String),
    sa.column('password_hash', sa.String),
    sa.column('role', sa.String),
    sa.column('is_active', sa.Boolean),
    sa.column('created_at', sa.DateTime(timezone=True)),
    sa.column('updated_at', sa.DateTime(timezone=True)),
)


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('username', sa.String(length=80), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='member'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("role IN ('super_admin','member')", name='ck_user_role_valid'),
        sa.UniqueConstraint('username', name='uq_users_username'),
    )
    op.create_index('ix_users_username', 'users', ['username'])

    # Seed the initial super admin so upgrading never locks everyone out.
    # Falls back to the same dev default as the old single-admin model
    # (admin / admin) when no env vars are set.
    username = os.environ.get('SUPER_ADMIN_USERNAME', 'admin')
    password_hash = os.environ.get('SUPER_ADMIN_PASSWORD_HASH') or generate_password_hash(
        os.environ.get('SUPER_ADMIN_PASSWORD', 'admin')
    )
    now = datetime.now(timezone.utc)
    op.bulk_insert(
        users_table,
        [
            {
                'id': uuid.uuid4(),
                'username': username,
                'password_hash': password_hash,
                'role': 'super_admin',
                'is_active': True,
                'created_at': now,
                'updated_at': now,
            }
        ],
    )


def downgrade():
    op.drop_index('ix_users_username', table_name='users')
    op.drop_table('users')
