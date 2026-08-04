"""Marshmallow schemas for Person."""
from marshmallow import Schema, fields, validate

from app.models.person import GENDER_VALUES
from app.schemas.common import PaginationQuerySchema


class PersonSchema(Schema):
    id = fields.UUID(dump_only=True)
    avatar = fields.String(allow_none=True, load_default=None)
    display_name = fields.String(required=True, validate=validate.Length(min=1, max=120))
    nickname = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=120))
    vrchat_name = fields.String(
        allow_none=True, load_default=None, validate=validate.Length(max=120)
    )
    discord = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=120))
    steam = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=120))
    twitter = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=120))
    country = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=100))
    gender = fields.String(allow_none=True, load_default=None, validate=validate.OneOf(GENDER_VALUES))
    birthday = fields.Date(allow_none=True, load_default=None)
    bio = fields.String(allow_none=True, load_default=None)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class PersonQuerySchema(PaginationQuerySchema):
    search = fields.String(load_default=None, allow_none=True)
    gender = fields.String(load_default=None, allow_none=True, validate=validate.OneOf(GENDER_VALUES))
    country = fields.String(load_default=None, allow_none=True)


person_schema = PersonSchema()
person_write_schema = PersonSchema(exclude=("id", "created_at", "updated_at"))
person_query_schema = PersonQuerySchema()
