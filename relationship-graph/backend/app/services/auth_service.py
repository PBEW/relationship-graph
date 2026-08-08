"""Business logic for authentication.

Credentials live in the `users` table (see app/models/user.py) - multiple
accounts can log in, each with a role (super_admin/member). Revoked token
IDs (jti) are tracked in an in-memory set: fine for a single dev process,
swap for Redis if this is ever deployed with multiple worker processes.
"""
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import check_password_hash

from app.repositories.user_repository import UserRepository
from app.utils.errors import APIError

_revoked_jtis: set[str] = set()


class AuthService:
    def __init__(self):
        self.repo = UserRepository()

    def authenticate(self, username: str, password: str) -> dict:
        user = self.repo.get_by_username(username)
        if not user or not check_password_hash(user.password_hash, password):
            raise APIError("Invalid username or password", status_code=401)
        if not user.is_active:
            raise APIError("This account has been disabled", status_code=401)

        identity = str(user.id)
        return {
            "access_token": create_access_token(identity=identity),
            "refresh_token": create_refresh_token(identity=identity),
        }

    def refresh(self, identity: str) -> dict:
        return {"access_token": create_access_token(identity=identity)}

    def revoke(self, jti: str) -> None:
        _revoked_jtis.add(jti)

    def is_revoked(self, jti: str) -> bool:
        return jti in _revoked_jtis
