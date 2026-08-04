"""Marshmallow schemas for Relationship."""
from marshmallow import Schema, ValidationError, fields, validate, validates_schema

from app.models.relationship import STATUS_VALUES
from app.schemas.common import PaginationQuerySchema
from app.schemas.person_schema import PersonSchema
from app.schemas.relationship_type_schema import RelationshipTypeSchema


class RelationshipSchema(Schema):
    id = fields.UUID(dump_only=True)
    person_a_id = fields.UUID(required=True)
    person_b_id = fields.UUID(required=True)
    relationship_type_id = fields.UUID(required=True)
    status = fields.String(load_default="active", validate=validate.OneOf(STATUS_VALUES))
    start_date = fields.Date(allow_none=True, load_default=None)
    end_date = fields.Date(allow_none=True, load_default=None)
    note = fields.String(allow_none=True, load_default=None)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    person_a = fields.Nested(PersonSchema, dump_only=True)
    person_b = fields.Nested(PersonSchema, dump_only=True)
    relationship_type = fields.Nested(RelationshipTypeSchema, dump_only=True)

    @validates_schema
    def validate_relationship(self, data, **kwargs):
        person_a_id = data.get("person_a_id")
        person_b_id = data.get("person_b_id")
        if person_a_id and person_b_id and person_a_id == person_b_id:
            raise ValidationError("person_a_id and person_b_id must be different", "person_b_id")

        start_date = data.get("start_date")
        end_date = data.get("end_date")
        if start_date and end_date and end_date < start_date:
            raise ValidationError("end_date must be on or after start_date", "end_date")


class RelationshipQuerySchema(PaginationQuerySchema):
    person_id = fields.UUID(load_default=None, allow_none=True)
    relationship_type_id = fields.UUID(load_default=None, allow_none=True)
    status = fields.String(load_default=None, allow_none=True, validate=validate.OneOf(STATUS_VALUES))


relationship_schema = RelationshipSchema()
relationship_write_schema = RelationshipSchema(
    exclude=("id", "created_at", "updated_at", "person_a", "person_b", "relationship_type")
)
relationship_query_schema = RelationshipQuerySchema()
