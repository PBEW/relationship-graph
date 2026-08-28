"""Person endpoints."""
from flask import Blueprint, jsonify, request

from app.schemas.person_schema import person_query_schema, person_schema, person_write_schema
from app.schemas.relationship_schema import relationship_schema
from app.services.person_service import PersonService
from app.utils.activity import record_activity
from app.utils.auth_decorators import login_required, super_admin_required
from app.utils.pagination import paginated_response

person_bp = Blueprint("people", __name__)
service = PersonService()


@person_bp.get("")
@login_required
def list_people():
    params = person_query_schema.load(request.args)
    pagination = service.list_people(**params)
    return jsonify(paginated_response(pagination, person_schema))


@person_bp.get("/<uuid:person_id>")
@login_required
def get_person(person_id):
    profile = service.get_profile(person_id)
    return jsonify(
        {
            "person": person_schema.dump(profile["person"]),
            "relationships": relationship_schema.dump(profile["relationships"], many=True),
            "timeline": profile["timeline"],
            "stats": profile["stats"],
        }
    )


@person_bp.post("")
@login_required
def create_person():
    data = person_write_schema.load(request.get_json(silent=True) or {})
    person = service.create_person(data)
    record_activity("create", "person", person.id, person.display_name)
    return jsonify(person_schema.dump(person)), 201


@person_bp.put("/<uuid:person_id>")
@login_required
def update_person(person_id):
    data = person_write_schema.load(request.get_json(silent=True) or {}, partial=True)
    person = service.update_person(person_id, data)
    record_activity("update", "person", person.id, person.display_name)
    return jsonify(person_schema.dump(person))


# Super admin only: deleting a person also silently takes every relationship
# they appear in, so it's the one action a member can't undo by re-typing.
@person_bp.delete("/<uuid:person_id>")
@super_admin_required
def delete_person(person_id):
    # Read the name before it's gone - the log is the only place it survives.
    person = service.get_person(person_id)
    display_name = person.display_name
    service.delete_person(person_id)
    record_activity("delete", "person", person_id, display_name)
    return "", 204


@person_bp.post("/<uuid:person_id>/avatar")
@login_required
def upload_avatar(person_id):
    file = request.files.get("avatar")
    person = service.upload_avatar(person_id, file)
    record_activity("update", "person", person.id, f"{person.display_name} (รูปโปรไฟล์)")
    return jsonify(person_schema.dump(person))
