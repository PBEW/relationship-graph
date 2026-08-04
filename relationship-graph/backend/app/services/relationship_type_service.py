"""Business logic for RelationshipType."""
from app.models.relationship_type import RelationshipType
from app.repositories.relationship_type_repository import RelationshipTypeRepository
from app.utils.errors import ConflictError, NotFoundError


class RelationshipTypeService:
    def __init__(self):
        self.repo = RelationshipTypeRepository()

    def list_types(self) -> list[RelationshipType]:
        return self.repo.list_all()

    def get_type(self, type_id) -> RelationshipType:
        rt = self.repo.get_by_id(type_id)
        if not rt:
            raise NotFoundError("Relationship type not found")
        return rt

    def create_type(self, data: dict) -> RelationshipType:
        if self.repo.get_by_name(data["name"]):
            raise ConflictError(f"Relationship type '{data['name']}' already exists")
        rt = RelationshipType(**data)
        return self.repo.add(rt)

    def update_type(self, type_id, data: dict) -> RelationshipType:
        rt = self.get_type(type_id)
        new_name = data.get("name")
        if new_name and new_name != rt.name and self.repo.get_by_name(new_name):
            raise ConflictError(f"Relationship type '{new_name}' already exists")
        for key, value in data.items():
            setattr(rt, key, value)
        return self.repo.update(rt)

    def delete_type(self, type_id) -> None:
        rt = self.get_type(type_id)
        if self.repo.is_in_use(type_id):
            raise ConflictError("Cannot delete a relationship type that is currently in use")
        self.repo.delete(rt)
