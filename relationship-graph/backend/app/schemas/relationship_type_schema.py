"""Marshmallow schemas for RelationshipType."""
import re

from marshmallow import Schema, fields, validate

HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


class RelationshipTypeSchema(Schema):
    id = fields.UUID(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    color = fields.String(
        required=True,
        validate=validate.Regexp(HEX_COLOR_RE, error="color must be a #RRGGBB hex string"),
    )
    icon = fields.String(required=True, validate=validate.Length(min=1, max=50))
    description = fields.String(allow_none=True, load_default=None)


relationship_type_schema = RelationshipTypeSchema()
relationship_type_write_schema = RelationshipTypeSchema()
