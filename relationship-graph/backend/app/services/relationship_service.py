"""Business logic for Relationship."""
from app.models.relationship import Relationship
from app.repositories.person_repository import PersonRepository
from app.repositories.relationship_repository import RelationshipRepository
from app.repositories.relationship_type_repository import RelationshipTypeRepository
from app.utils.errors import APIError, NotFoundError


class RelationshipService:
    def __init__(self):
        self.repo = RelationshipRepository()
        self.person_repo = PersonRepository()
        self.type_repo = RelationshipTypeRepository()

    def list_relationships(
        self, *, person_id=None, relationship_type_id=None, status=None, page=1, per_page=20
    ):
        query = self.repo.query(
            person_id=person_id, relationship_type_id=relationship_type_id, status=status
        )
        return self.repo.paginate(query, page, per_page)

    def get_relationship(self, relationship_id) -> Relationship:
        rel = self.repo.get_by_id(relationship_id)
        if not rel:
            raise NotFoundError("Relationship not found")
        return rel

    def _validate_references(self, person_a_id, person_b_id, relationship_type_id) -> None:
        if not self.person_repo.get_by_id(person_a_id):
            raise APIError("person_a_id does not exist", status_code=422)
        if not self.person_repo.get_by_id(person_b_id):
            raise APIError("person_b_id does not exist", status_code=422)
        if not self.type_repo.get_by_id(relationship_type_id):
            raise APIError("relationship_type_id does not exist", status_code=422)

    def create_relationship(self, data: dict) -> Relationship:
        self._validate_references(
            data["person_a_id"], data["person_b_id"], data["relationship_type_id"]
        )
        rel = Relationship(**data)
        return self.repo.add(rel)

    def update_relationship(self, relationship_id, data: dict) -> Relationship:
        rel = self.get_relationship(relationship_id)
        self._validate_references(
            data.get("person_a_id", rel.person_a_id),
            data.get("person_b_id", rel.person_b_id),
            data.get("relationship_type_id", rel.relationship_type_id),
        )
        for key, value in data.items():
            setattr(rel, key, value)
        return self.repo.update(rel)

    def delete_relationship(self, relationship_id) -> None:
        rel = self.get_relationship(relationship_id)
        self.repo.delete(rel)
