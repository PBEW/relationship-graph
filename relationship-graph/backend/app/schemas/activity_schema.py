"""Marshmallow schemas for the activity log."""
from marshmallow import Schema, fields, validate

from app.models.activity_log import ACTION_VALUES
from app.schemas.common import PaginationQuerySchema


class ActivityLogSchema(Schema):
    id = fields.UUID(dump_only=True)
    user_id = fields.UUID(dump_only=True, allow_none=True)
    username = fields.String(dump_only=True)
    action = fields.String(dump_only=True)
    entity_type = fields.String(dump_only=True)
    entity_id = fields.UUID(dump_only=True, allow_none=True)
    summary = fields.String(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    # False once the account behind an entry has been deleted, which is worth
    # showing rather than leaving the reader to wonder.
    user_exists = fields.Method("get_user_exists", dump_only=True)

    def get_user_exists(self, obj) -> bool:
        return obj.user_id is not None


class ActivityQuerySchema(PaginationQuerySchema):
    action = fields.String(load_default=None, allow_none=True, validate=validate.OneOf(ACTION_VALUES))
    user_id = fields.UUID(load_default=None, allow_none=True)


activity_log_schema = ActivityLogSchema()
activity_query_schema = ActivityQuerySchema()
