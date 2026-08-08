"""SQLAlchemy models. Imported eagerly so all tables register on db.metadata."""
from app.models.avatar import Avatar
from app.models.person import Person
from app.models.relationship_type import RelationshipType
from app.models.relationship import Relationship
from app.models.user import User

__all__ = ["Avatar", "Person", "RelationshipType", "Relationship", "User"]
