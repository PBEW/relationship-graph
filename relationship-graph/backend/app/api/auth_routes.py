"""Authentication endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.extensions import limiter
from app.schemas.auth_schema import login_schema
from app.services.activity_service import ActivityService
from app.services.auth_service import AuthService
from app.utils.auth_decorators import get_current_user, login_required

auth_bp = Blueprint("auth", __name__)
service = AuthService()
activity_service = ActivityService()


# The only unauthenticated write endpoint, so the only one worth guessing at.
# Loose enough that a person fumbling their password never notices, tight
# enough that credential stuffing isn't practical.
@auth_bp.post("/login")
@limiter.limit("10 per minute; 60 per hour")
def login():
    data = login_schema.load(request.get_json(silent=True) or {})
    user, tokens = service.authenticate(data["username"], data["password"])
    activity_service.record_login(user)
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
    activity_service.record(get_current_user(), "logout", "session")
    jti = get_jwt()["jti"]
    service.revoke(jti)
    return jsonify({"message": "Successfully logged out"})


@auth_bp.get("/me")
@login_required
def me():
    user = get_current_user()
    return jsonify({"id": str(user.id), "username": user.username, "role": user.role})
