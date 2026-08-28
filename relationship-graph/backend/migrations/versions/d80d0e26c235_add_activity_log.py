"""add activity log and users.last_login_at

Gives admins a history of who signed in and who changed what.

Revision ID: d80d0e26c235
Revises: 75aeafbe0ee4
Create Date: 2026-08-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd80d0e26c235'
down_revision = '75aeafbe0ee4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True)
    )

    op.create_table(
        'activity_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        # SET NULL, not CASCADE: the trail should outlive the account, since
        # "who deleted this?" is exactly what it's for.
        sa.Column(
            'user_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('username', sa.String(length=80), nullable=False),
        sa.Column('action', sa.String(length=30), nullable=False),
        sa.Column('entity_type', sa.String(length=40), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('summary', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "action IN ('login','logout','create','update','delete')",
            name='ck_activity_log_action_valid',
        ),
    )
    op.create_index('ix_activity_logs_created_at', 'activity_logs', ['created_at'])
    op.create_index('ix_activity_logs_action', 'activity_logs', ['action'])
    op.create_index('ix_activity_logs_user_id', 'activity_logs', ['user_id'])


def downgrade():
    op.drop_index('ix_activity_logs_user_id', table_name='activity_logs')
    op.drop_index('ix_activity_logs_action', table_name='activity_logs')
    op.drop_index('ix_activity_logs_created_at', table_name='activity_logs')
    op.drop_table('activity_logs')
    op.drop_column('users', 'last_login_at')
