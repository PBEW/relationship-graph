"""Business logic for Relationship."""
from app.models.relationship import Relationship
from app.repositories.person_repository import PersonRepository
from app.repositories.relationship_repository import RelationshipRepository
from app.repositories.relationship_type_repository import RelationshipTypeRepository
from app.utils.errors import APIError, ConflictError, NotFoundError


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

    def _reject_active_duplicate(
        self, person_a_id, person_b_id, relationship_type_id, exclude_id=None
    ) -> None:
        """Two people can only hold one *active* relationship of a given type.

        Ended ones are deliberately exempt: dating, breaking up and getting
        back together is real history worth recording as separate rows.

        This is a check rather than a database constraint, so two writes
        landing at the same instant could still slip a duplicate through -
        acceptable for a community this size, but the reason a unique index
        would be the sturdier fix if that ever changes.
        """
        existing = self.repo.find_active_between(
            person_a_id, person_b_id, relationship_type_id, exclude_id=exclude_id
        )
        if existing:
            raise ConflictError(
                "These two already have an active relationship of this type. "
                "End the existing one first, or pick a different type."
            )

    def create_relationship(self, data: dict) -> Relationship:
        self._validate_references(
            data["person_a_id"], data["person_b_id"], data["relationship_type_id"]
        )
        if data.get("status", "active") == "active":
            self._reject_active_duplicate(
                data["person_a_id"], data["person_b_id"], data["relationship_type_id"]
            )
        rel = Relationship(**data)
        return self.repo.add(rel)

    def update_relationship(self, relationship_id, data: dict) -> Relationship:
        rel = self.get_relationship(relationship_id)
        person_a_id = data.get("person_a_id", rel.person_a_id)
        person_b_id = data.get("person_b_id", rel.person_b_id)
        relationship_type_id = data.get("relationship_type_id", rel.relationship_type_id)
        self._validate_references(person_a_id, person_b_id, relationship_type_id)
        # Re-editing a row into a clash counts too - e.g. reviving an ended
        # relationship when an active one of the same type already exists.
        if data.get("status", rel.status) == "active":
            self._reject_active_duplicate(
                person_a_id, person_b_id, relationship_type_id, exclude_id=rel.id
            )
        for key, value in data.items():
            setattr(rel, key, value)
        return self.repo.update(rel)

    def delete_relationship(self, relationship_id) -> None:
        rel = self.get_relationship(relationship_id)
        self.repo.delete(rel)
