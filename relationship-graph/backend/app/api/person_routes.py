"""Person endpoints."""
from flask import Blueprint, jsonify, request

from app.schemas.person_schema import person_query_schema, person_schema, person_write_schema
from app.schemas.relationship_schema import relationship_schema
from app.services.person_service import PersonService
from app.utils.pagination import paginated_response

person_bp = Blueprint("people", __name__)
service = PersonService()


@person_bp.get("")
def list_people():
    params = person_query_schema.load(request.args)
    pagination = service.list_people(**params)
    return jsonify(paginated_response(pagination, person_schema))


@person_bp.get("/<uuid:person_id>")
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
def create_person():
    data = person_write_schema.load(request.get_json(silent=True) or {})
    person = service.create_person(data)
    return jsonify(person_schema.dump(person)), 201


@person_bp.put("/<uuid:person_id>")
def update_person(person_id):
    data = person_write_schema.load(request.get_json(silent=True) or {}, partial=True)
    person = service.update_person(person_id, data)
    return jsonify(person_schema.dump(person))


@person_bp.delete("/<uuid:person_id>")
def delete_person(person_id):
    service.delete_person(person_id)
    return "", 204


@person_bp.post("/<uuid:person_id>/avatar")
def upload_avatar(person_id):
    file = request.files.get("avatar")
    person = service.upload_avatar(person_id, file)
    return jsonify(person_schema.dump(person))
