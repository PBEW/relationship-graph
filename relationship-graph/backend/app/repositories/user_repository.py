"""Data access for User."""
from app.extensions import db
from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def list_all(self):
        return db.session.query(User).order_by(User.username.asc()).all()

    def get_by_username(self, username: str) -> User | None:
        return db.session.query(User).filter_by(username=username).first()

    def count_active_super_admins(self, exclude_id=None) -> int:
        query = db.session.query(User.id).filter_by(role="super_admin", is_active=True)
        if exclude_id is not None:
            query = query.filter(User.id != exclude_id)
        return query.count()
