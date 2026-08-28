"""Data access for ActivityLog."""
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.activity_log import ActivityLog
from app.repositories.base_repository import BaseRepository


class ActivityLogRepository(BaseRepository[ActivityLog]):
    def __init__(self):
        super().__init__(ActivityLog)

    def query(self, *, action: str | None = None, user_id=None):
        q = db.session.query(ActivityLog).options(joinedload(ActivityLog.user))

        if action:
            q = q.filter(ActivityLog.action == action)
        if user_id is not None:
            q = q.filter(ActivityLog.user_id == user_id)

        # Newest first - the only order this is ever read in.
        return q.order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
