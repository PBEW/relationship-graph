"""Marshmallow schemas for request validation and serialization."""
from app.schemas.person_schema import person_query_schema, person_schema, person_write_schema
from app.schemas.relationship_schema import (
    relationship_query_schema,
    relationship_schema,
    relationship_write_schema,
)
from app.schemas.relationship_type_schema import (
    relationship_type_schema,
    relationship_type_write_schema,
)

__all__ = [
    "person_schema",
    "person_write_schema",
    "person_query_schema",
    "relationship_schema",
    "relationship_write_schema",
    "relationship_query_schema",
    "relationship_type_schema",
    "relationship_type_write_schema",
]
