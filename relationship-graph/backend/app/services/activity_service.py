"""Business logic for the activity log."""
from app.extensions import db
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.repositories.activity_log_repository import ActivityLogRepository


class ActivityService:
    def __init__(self):
        self.repo = ActivityLogRepository()

    def list_activity(self, *, action=None, user_id=None, page=1, per_page=20):
        return self.repo.paginate(self.repo.query(action=action, user_id=user_id), page, per_page)

    def record(
        self,
        user: User,
        action: str,
        entity_type: str,
        entity_id=None,
        summary: str | None = None,
    ) -> ActivityLog:
        entry = ActivityLog(
            user_id=user.id,
            # Snapshot rather than relying on the relationship, so the entry
            # still names someone after the account is renamed or removed.
            username=user.username,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            summary=(summary[:255] if summary else None),
        )
        return self.repo.add(entry)

    def record_login(self, user: User) -> ActivityLog:
        # Denormalised onto the account so the user list can show it directly.
        entry = self.record(user, "login", "session")
        user.last_login_at = entry.created_at
        db.session.commit()
        return entry
