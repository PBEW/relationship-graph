"""Business logic for dashboard statistics."""
from sqlalchemy import func

from app.extensions import db
from app.models.relationship import Relationship
from app.models.relationship_type import RelationshipType
from app.repositories.person_repository import PersonRepository
from app.repositories.relationship_repository import RelationshipRepository


class DashboardService:
    def __init__(self):
        self.person_repo = PersonRepository()
        self.relationship_repo = RelationshipRepository()

    def get_stats(self) -> dict:
        distribution_rows = (
            db.session.query(
                RelationshipType.name,
                RelationshipType.color,
                func.count(Relationship.id),
            )
            .outerjoin(Relationship, Relationship.relationship_type_id == RelationshipType.id)
            .group_by(RelationshipType.id)
            .order_by(RelationshipType.name.asc())
            .all()
        )

        return {
            "total_people": self.person_repo.count(),
            "total_relationships": self.relationship_repo.count(),
            "relationship_distribution": [
                {"name": name, "color": color, "count": count}
                for name, color, count in distribution_rows
            ],
            "most_connected": [
                {
                    "person_id": str(person.id),
                    "display_name": person.display_name,
                    "avatar": person.avatar,
                    "relationship_count": count,
                }
                for person, count in self.person_repo.most_connected(limit=10)
            ],
            "recently_added": [
                {
                    "person_id": str(person.id),
                    "display_name": person.display_name,
                    "avatar": person.avatar,
                    "created_at": person.created_at.isoformat(),
                }
                for person in self.person_repo.recently_added(limit=10)
            ],
        }
