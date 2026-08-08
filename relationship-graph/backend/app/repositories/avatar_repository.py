"""Data access for Avatar."""
from app.models.avatar import Avatar
from app.repositories.base_repository import BaseRepository


class AvatarRepository(BaseRepository[Avatar]):
    def __init__(self):
        super().__init__(Avatar)
