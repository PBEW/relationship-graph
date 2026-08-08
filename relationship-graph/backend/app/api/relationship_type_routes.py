"""RelationshipType endpoints."""
from flask import Blueprint, jsonify, request

from app.schemas.relationship_type_schema import (
    relationship_type_schema,
    relationship_type_write_schema,
)
from app.services.relationship_type_service import RelationshipTypeService
from app.utils.auth_decorators import login_required, super_admin_required

relationship_type_bp = Blueprint("relationship_types", __name__)
service = RelationshipTypeService()


@relationship_type_bp.get("")
@login_required
def list_types():
    types = service.list_types()
    return jsonify(relationship_type_schema.dump(types, many=True))


@relationship_type_bp.get("/<uuid:type_id>")
@login_required
def get_type(type_id):
    rt = service.get_type(type_id)
    return jsonify(relationship_type_schema.dump(rt))


@relationship_type_bp.post("")
@login_required
def create_type():
    data = relationship_type_write_schema.load(request.get_json(silent=True) or {})
    rt = service.create_type(data)
    return jsonify(relationship_type_schema.dump(rt)), 201


@relationship_type_bp.put("/<uuid:type_id>")
@login_required
def update_type(type_id):
    data = relationship_type_write_schema.load(request.get_json(silent=True) or {}, partial=True)
    rt = service.update_type(type_id, data)
    return jsonify(relationship_type_schema.dump(rt))


# Super admin only: relationship types are shared vocabulary for the whole
# community, not per-person data a member should be able to retire.
@relationship_type_bp.delete("/<uuid:type_id>")
@super_admin_required
def delete_type(type_id):
    service.delete_type(type_id)
    return "", 204
