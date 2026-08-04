"""SQLAlchemy models. Imported eagerly so all tables register on db.metadata."""
from app.models.person import Person
from app.models.relationship_type import RelationshipType
from app.models.relationship import Relationship

__all__ = ["Person", "RelationshipType", "Relationship"]
