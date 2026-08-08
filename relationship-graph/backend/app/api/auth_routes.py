"""Authentication endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.schemas.auth_schema import login_schema
from app.services.auth_service import AuthService
from app.utils.auth_decorators import get_current_user, login_required

auth_bp = Blueprint("auth", __name__)
service = AuthService()


@auth_bp.post("/login")
def login():
    data = login_schema.load(request.get_json(silent=True) or {})
    tokens = service.authenticate(data["username"], data["password"])
    return jsonify(tokens)


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    get_current_user()  # 401s if the account was disabled since this refresh token was issued
    return jsonify(service.refresh(identity))


@auth_bp.post("/logout")
@login_required
def logout():
    jti = get_jwt()["jti"]
    service.revoke(jti)
    return jsonify({"message": "Successfully logged out"})


@auth_bp.get("/me")
@login_required
def me():
    user = get_current_user()
    return jsonify({"id": str(user.id), "username": user.username, "role": user.role})
