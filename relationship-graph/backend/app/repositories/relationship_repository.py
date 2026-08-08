"""Data access for Relationship."""
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.relationship import Relationship
from app.repositories.base_repository import BaseRepository


class RelationshipRepository(BaseRepository[Relationship]):
    def __init__(self):
        super().__init__(Relationship)

    def _base_query(self):
        return db.session.query(Relationship).options(
            joinedload(Relationship.person_a),
            joinedload(Relationship.person_b),
            joinedload(Relationship.relationship_type),
        )

    def query(self, *, person_id=None, relationship_type_id=None, status: str | None = None):
        q = self._base_query()

        if person_id is not None:
            q = q.filter(
                or_(
                    Relationship.person_a_id == person_id,
                    Relationship.person_b_id == person_id,
                )
            )
        if relationship_type_id is not None:
            q = q.filter(Relationship.relationship_type_id == relationship_type_id)
        if status:
            q = q.filter(Relationship.status == status)

        return q.order_by(Relationship.start_date.desc().nulls_last())

    def get_by_id(self, entity_id) -> Relationship | None:
        return self._base_query().filter(Relationship.id == entity_id).first()

    def for_person(self, person_id):
        return self.query(person_id=person_id).all()

    def list_all(self):
        return self._base_query().all()

    def count(self) -> int:
        return db.session.query(Relationship.id).count()

    def find_active_between(
        self, person_a_id, person_b_id, relationship_type_id, exclude_id=None
    ) -> Relationship | None:
        """An existing *active* relationship of this type between these two,
        in whichever order they were recorded."""
        query = db.session.query(Relationship).filter(
            Relationship.relationship_type_id == relationship_type_id,
            Relationship.status == "active",
            or_(
                and_(
                    Relationship.person_a_id == person_a_id,
                    Relationship.person_b_id == person_b_id,
                ),
                and_(
                    Relationship.person_a_id == person_b_id,
                    Relationship.person_b_id == person_a_id,
                ),
            ),
        )
        if exclude_id is not None:
            query = query.filter(Relationship.id != exclude_id)
        return query.first()
