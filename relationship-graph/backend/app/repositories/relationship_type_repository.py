"""Data access for RelationshipType."""
from app.extensions import db
from app.models.relationship import Relationship
from app.models.relationship_type import RelationshipType
from app.repositories.base_repository import BaseRepository


class RelationshipTypeRepository(BaseRepository[RelationshipType]):
    def __init__(self):
        super().__init__(RelationshipType)

    def list_all(self):
        return (
            db.session.query(RelationshipType).order_by(RelationshipType.name.asc()).all()
        )

    def get_by_name(self, name: str) -> RelationshipType | None:
        return db.session.query(RelationshipType).filter_by(name=name).first()

    def is_in_use(self, relationship_type_id) -> bool:
        return (
            db.session.query(Relationship.id)
            .filter(Relationship.relationship_type_id == relationship_type_id)
            .first()
            is not None
        )
