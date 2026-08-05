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
        'name': 'เพื่อน',
        'color': '#06B6D4',
        'icon': 'users',
        'description': 'รู้จักกันแบบเพื่อนที่เจอกันบ่อยๆ',
    },
    {
        'name': 'พี่น้อง',
        'color': '#6366F1',
        'icon': 'users-round',
        'description': 'มองกันเหมือนพี่น้อง',
    },
    {
        'name': 'เป็นแฟนกัน',
        'color': '#EC4899',
        'icon': 'heart',
        'description': 'กำลังคบหาดูใจกันอยู่',
    },
    {
        'name': 'แต่งงานแล้ว',
        'color': '#F43F5E',
        'icon': 'gem',
        'description': 'แต่งงาน/ผูกพันกันในคอมมูนิตี้',
    },
    {
        'name': 'คู่ชีวิต',
        'color': '#A855F7',
        'icon': 'handshake',
        'description': 'คู่ที่ไว้ใจกันสนิท (ธุรกิจ งานสร้างสรรค์ หรือส่วนตัว)',
    },
    {
        'name': 'แฟนเก่า',
        'color': '#F97316',
        'icon': 'heart-crack',
        'description': 'เคยคบ/แต่งงานกันมาก่อน ตอนนี้เลิกกันแล้ว',
    },
    {
        'name': 'ศัตรู',
        'color': '#DC2626',
        'icon': 'swords',
        'description': 'มีความขัดแย้งหรือเป็นปฏิปักษ์กัน',
    },
    {
        'name': 'บล็อก',
        'color': '#171717',
        'icon': 'ban',
        'description': 'อีกฝ่ายบล็อกอีกฝ่ายไว้',
    },
    {
        'name': 'ปิดเสียง',
        'color': '#64748B',
        'icon': 'mic-off',
        'description': 'อีกฝ่ายปิดเสียงอีกฝ่ายไว้',
    },
    {
        'name': 'กิลด์',
        'color': '#16A34A',
        'icon': 'shield',
        'description': 'อยู่กิลด์/กลุ่ม/แก๊งเดียวกัน',
    },
    {
        'name': 'ครอบครัว',
        'color': '#0EA5E9',
        'icon': 'home',
        'description': 'มองกันเหมือนครอบครัวที่เลือกเอง',
    },
    {
        'name': 'คนโปรด',
        'color': '#EAB308',
        'icon': 'star',
        'description': 'คนที่สนิทและชอบเป็นพิเศษ',
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
