"""Business logic for User (account) management - super admin only."""
from werkzeug.security import generate_password_hash

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.utils.errors import ConflictError, NotFoundError


class UserService:
    def __init__(self):
        self.repo = UserRepository()

    def list_users(self) -> list[User]:
        return self.repo.list_all()

    def get_user(self, user_id) -> User:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def create_user(self, data: dict) -> User:
        if self.repo.get_by_username(data["username"]):
            raise ConflictError(f"Username '{data['username']}' is already taken")
        password = data.pop("password")
        user = User(**data, password_hash=generate_password_hash(password))
        return self.repo.add(user)

    def update_user(self, user_id, data: dict, current_user: User) -> User:
        user = self.get_user(user_id)

        new_username = data.get("username")
        if new_username and new_username != user.username and self.repo.get_by_username(new_username):
            raise ConflictError(f"Username '{new_username}' is already taken")

        demoting = "role" in data and data["role"] != "super_admin" and user.role == "super_admin"
        deactivating = "is_active" in data and not data["is_active"] and user.is_active
        if (demoting or deactivating) and self._is_last_active_super_admin(user):
            raise ConflictError("Cannot remove the last active super admin")

        password = data.pop("password", None)
        if password:
            user.password_hash = generate_password_hash(password)

        for key, value in data.items():
            setattr(user, key, value)
        return self.repo.update(user)

    def delete_user(self, user_id, current_user: User) -> None:
        user = self.get_user(user_id)
        if user.id == current_user.id:
            raise ConflictError("Cannot delete your own account")
        if self._is_last_active_super_admin(user):
            raise ConflictError("Cannot delete the last active super admin")
        self.repo.delete(user)

    def _is_last_active_super_admin(self, user: User) -> bool:
        return (
            user.role == "super_admin"
            and user.is_active
            and self.repo.count_active_super_admins(exclude_id=user.id) == 0
        )
