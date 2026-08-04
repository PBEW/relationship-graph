"""Authentication endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.schemas.auth_schema import login_schema
from app.services.auth_service import AuthService

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
    return jsonify(service.refresh(identity))


@auth_bp.post("/logout")
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    service.revoke(jti)
    return jsonify({"message": "Successfully logged out"})


@auth_bp.get("/me")
@jwt_required()
def me():
    return jsonify({"username": get_jwt_identity()})
