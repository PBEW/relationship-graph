"""Business logic for Person."""
from app.models.person import Person
from app.repositories.person_repository import PersonRepository
from app.repositories.relationship_repository import RelationshipRepository
from app.utils.errors import NotFoundError
from app.utils.uploads import delete_avatar, save_avatar


class PersonService:
    def __init__(self):
        self.repo = PersonRepository()
        self.relationship_repo = RelationshipRepository()

    def list_people(self, *, search=None, gender=None, country=None, page=1, per_page=20):
        query = self.repo.query(search=search, gender=gender, country=country)
        return self.repo.paginate(query, page, per_page)

    def get_person(self, person_id) -> Person:
        person = self.repo.get_by_id(person_id)
        if not person:
            raise NotFoundError("Person not found")
        return person

    def get_profile(self, person_id) -> dict:
        person = self.get_person(person_id)
        relationships = self.relationship_repo.for_person(person_id)
        return {
            "person": person,
            "relationships": relationships,
            "timeline": self._build_timeline(person_id, relationships),
            "stats": self._build_stats(relationships),
        }

    @staticmethod
    def _build_stats(relationships) -> dict:
        by_type: dict[str, int] = {}
        for rel in relationships:
            by_type[rel.relationship_type.name] = by_type.get(rel.relationship_type.name, 0) + 1
        return {
            "total_relationships": len(relationships),
            "active_relationships": sum(1 for r in relationships if r.status == "active"),
            "ended_relationships": sum(1 for r in relationships if r.status == "ended"),
            "by_type": by_type,
        }

    @staticmethod
    def _build_timeline(person_id, relationships) -> list[dict]:
        events = []
        for rel in relationships:
            other = rel.person_b if rel.person_a_id == person_id else rel.person_a
            base = {
                "relationship_id": str(rel.id),
                "relationship_type": rel.relationship_type.name,
                "color": rel.relationship_type.color,
                "icon": rel.relationship_type.icon,
                "with_person_id": str(other.id),
                "with_person_name": other.display_name,
                "note": rel.note,
            }
            if rel.start_date:
                events.append({**base, "date": rel.start_date.isoformat(), "event": "started"})
            if rel.end_date:
                events.append({**base, "date": rel.end_date.isoformat(), "event": "ended"})
        events.sort(key=lambda e: e["date"])
        return events

    def create_person(self, data: dict) -> Person:
        person = Person(**data)
        return self.repo.add(person)

    def update_person(self, person_id, data: dict) -> Person:
        person = self.get_person(person_id)
        for key, value in data.items():
            setattr(person, key, value)
        return self.repo.update(person)

    def delete_person(self, person_id) -> None:
        person = self.get_person(person_id)
        avatar = person.avatar
        self.repo.delete(person)
        delete_avatar(avatar)

    def upload_avatar(self, person_id, file) -> Person:
        person = self.get_person(person_id)
        old_avatar = person.avatar
        person.avatar = save_avatar(file)
        self.repo.update(person)
        delete_avatar(old_avatar)
        return person
