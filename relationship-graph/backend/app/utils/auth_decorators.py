"""Auth guards layered on top of Flask-JWT-Extended.

A valid JWT alone isn't enough: a super admin can disable an account at any
time (see UserService.update_user), and that must take effect immediately -
not just after the access token expires. So every protected route re-checks
`is_active` against the database, not just the token's signature.
"""
from functools import wraps

from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.utils.errors import APIError

_user_repo = UserRepository()


def get_current_user() -> User:
    user_id = get_jwt_identity()
    user = _user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise APIError("This account has been disabled", status_code=401)
    return user


def login_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        get_current_user()
        return fn(*args, **kwargs)

    return wrapper


def super_admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if user.role != "super_admin":
            raise APIError("Super admin access required", status_code=403)
        return fn(*args, **kwargs)

    return wrapper
