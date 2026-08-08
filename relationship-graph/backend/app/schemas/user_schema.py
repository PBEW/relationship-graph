"""Marshmallow schemas for User (account) management."""
from marshmallow import Schema, fields, validate

from app.models.user import ROLE_VALUES


class UserSchema(Schema):
    id = fields.UUID(dump_only=True)
    username = fields.String(required=True, validate=validate.Length(min=3, max=80))
    password = fields.String(required=True, load_only=True, validate=validate.Length(min=4, max=128))
    role = fields.String(load_default="member", validate=validate.OneOf(ROLE_VALUES))
    is_active = fields.Boolean(load_default=True)
    created_at = fields.DateTime(dump_only=True)


user_schema = UserSchema(exclude=("password",))
user_write_schema = UserSchema(exclude=("id", "created_at"))
