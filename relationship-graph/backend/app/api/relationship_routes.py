"""Relationship endpoints."""
from flask import Blueprint, jsonify, request

from app.schemas.relationship_schema import (
    relationship_query_schema,
    relationship_schema,
    relationship_write_schema,
)
from app.services.relationship_service import RelationshipService
from app.utils.activity import record_activity
from app.utils.auth_decorators import login_required
from app.utils.pagination import paginated_response

relationship_bp = Blueprint("relationships", __name__)
service = RelationshipService()


def _describe(rel) -> str:
    """'Amy ↔ Ben (เพื่อน)' - readable even after the rows are deleted."""
    return f"{rel.person_a.display_name} ↔ {rel.person_b.display_name} ({rel.relationship_type.name})"


@relationship_bp.get("")
@login_required
def list_relationships():
    params = relationship_query_schema.load(request.args)
    pagination = service.list_relationships(**params)
    return jsonify(paginated_response(pagination, relationship_schema))


@relationship_bp.get("/<uuid:relationship_id>")
@login_required
def get_relationship(relationship_id):
    rel = service.get_relationship(relationship_id)
    return jsonify(relationship_schema.dump(rel))


@relationship_bp.post("")
@login_required
def create_relationship():
    data = relationship_write_schema.load(request.get_json(silent=True) or {})
    rel = service.create_relationship(data)
    record_activity("create", "relationship", rel.id, _describe(rel))
    return jsonify(relationship_schema.dump(rel)), 201


@relationship_bp.put("/<uuid:relationship_id>")
@login_required
def update_relationship(relationship_id):
    data = relationship_write_schema.load(request.get_json(silent=True) or {}, partial=True)
    rel = service.update_relationship(relationship_id, data)
    record_activity("update", "relationship", rel.id, _describe(rel))
    return jsonify(relationship_schema.dump(rel))


@relationship_bp.delete("/<uuid:relationship_id>")
@login_required
def delete_relationship(relationship_id):
    description = _describe(service.get_relationship(relationship_id))
    service.delete_relationship(relationship_id)
    record_activity("delete", "relationship", relationship_id, description)
    return "", 204
