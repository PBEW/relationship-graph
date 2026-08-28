"""User (account) management endpoints - super admin only."""
from flask import Blueprint, jsonify, request

from app.schemas.user_schema import user_schema, user_write_schema
from app.services.user_service import UserService
from app.utils.activity import record_activity
from app.utils.auth_decorators import get_current_user, super_admin_required

user_bp = Blueprint("users", __name__)
service = UserService()


@user_bp.get("")
@super_admin_required
def list_users():
    users = service.list_users()
    return jsonify(user_schema.dump(users, many=True))


@user_bp.post("")
@super_admin_required
def create_user():
    data = user_write_schema.load(request.get_json(silent=True) or {})
    user = service.create_user(data)
    record_activity("create", "user", user.id, user.username)
    return jsonify(user_schema.dump(user)), 201


@user_bp.patch("/<uuid:user_id>")
@super_admin_required
def update_user(user_id):
    data = user_write_schema.load(request.get_json(silent=True) or {}, partial=True)
    current_user = get_current_user()
    user = service.update_user(user_id, data, current_user)
    record_activity("update", "user", user.id, user.username)
    return jsonify(user_schema.dump(user))


@user_bp.delete("/<uuid:user_id>")
@super_admin_required
def delete_user(user_id):
    current_user = get_current_user()
    username = service.get_user(user_id).username
    service.delete_user(user_id, current_user)
    record_activity("delete", "user", user_id, username)
    return "", 204
