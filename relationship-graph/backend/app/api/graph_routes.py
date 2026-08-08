"""Graph endpoint — nodes/edges payload shaped for React Flow."""
from flask import Blueprint, jsonify

from app.repositories.person_repository import PersonRepository
from app.repositories.relationship_repository import RelationshipRepository
from app.utils.auth_decorators import login_required

graph_bp = Blueprint("graph", __name__)
person_repo = PersonRepository()
relationship_repo = RelationshipRepository()


@graph_bp.get("")
@login_required
def get_graph():
    people = person_repo.list_all()
    relationships = relationship_repo.list_all()

    nodes = [
        {
            "id": str(person.id),
            "display_name": person.display_name,
            "nickname": person.nickname,
            "avatar": person.avatar,
        }
        for person in people
    ]

    edges = [
        {
            "id": str(rel.id),
            "source": str(rel.person_a_id),
            "target": str(rel.person_b_id),
            "status": rel.status,
            "start_date": rel.start_date.isoformat() if rel.start_date else None,
            "end_date": rel.end_date.isoformat() if rel.end_date else None,
            "note": rel.note,
            "relationship_type": {
                "id": str(rel.relationship_type.id),
                "name": rel.relationship_type.name,
                "color": rel.relationship_type.color,
                "icon": rel.relationship_type.icon,
                "description": rel.relationship_type.description,
            },
        }
        for rel in relationships
    ]

    return jsonify({"nodes": nodes, "edges": edges})
