"""Business logic for authentication.

Single-admin app - there's no User table in the schema, so credentials come
from environment variables (see app/config.py). Revoked token IDs (jti) are
tracked in an in-memory set: fine for a single dev process; swap for Redis
if this is ever deployed with multiple worker processes.
"""
from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import check_password_hash

from app.utils.errors import APIError

_revoked_jtis: set[str] = set()


class AuthService:
    def authenticate(self, username: str, password: str) -> dict:
        admin_username = current_app.config["ADMIN_USERNAME"]
        admin_password_hash = current_app.config["ADMIN_PASSWORD_HASH"]

        valid = username == admin_username and check_password_hash(admin_password_hash, password)
        if not valid:
            raise APIError("Invalid username or password", status_code=401)

        return {
            "access_token": create_access_token(identity=username),
            "refresh_token": create_refresh_token(identity=username),
        }

    def refresh(self, identity: str) -> dict:
        return {"access_token": create_access_token(identity=identity)}

    def revoke(self, jti: str) -> None:
        _revoked_jtis.add(jti)

    def is_revoked(self, jti: str) -> bool:
        return jti in _revoked_jtis
