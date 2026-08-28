"""ActivityLog model — an append-only record of who did what, and when.

Covers both sign-ins and data changes so the admin panel can show one
chronological history rather than two disconnected ones.

Rows are never updated or deleted by the app: an audit trail that its own
users can edit isn't worth keeping.
"""
import uuid

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db
from app.models.base import TimestampMixin

ACTION_VALUES = ("login", "logout", "create", "update", "delete")
ENTITY_TYPE_VALUES = ("session", "person", "relationship", "relationship_type", "user")


class ActivityLog(TimestampMixin, db.Model):
    __tablename__ = "activity_logs"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Kept on delete rather than cascading: the point of the trail is to say
    # who did something, which matters most once the account is gone.
    user_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # Snapshot of the name at the time, so entries stay readable after the
    # account is deleted or renamed.
    username = db.Column(db.String(80), nullable=False)

    action = db.Column(db.String(30), nullable=False)
    entity_type = db.Column(db.String(40), nullable=False)
    entity_id = db.Column(UUID(as_uuid=True), nullable=True)
    # Human-readable label for the thing acted on ("Amy Williams", "เพื่อน"),
    # captured now because the row it names may be gone by the time anyone
    # reads the log.
    summary = db.Column(db.String(255), nullable=True)

    user = db.relationship("User")

    __table_args__ = (
        db.CheckConstraint(
            "action IN ('login','logout','create','update','delete')",
            name="ck_activity_log_action_valid",
        ),
        # The log is almost always read newest-first, optionally narrowed to
        # one kind of action or one person.
        db.Index("ix_activity_logs_created_at", "created_at"),
        db.Index("ix_activity_logs_action", "action"),
        db.Index("ix_activity_logs_user_id", "user_id"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ActivityLog {self.username} {self.action} {self.entity_type}>"
