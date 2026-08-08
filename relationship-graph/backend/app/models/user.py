"""User model — an account that can log in to the app."""
import uuid

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db
from app.models.base import TimestampMixin

ROLE_VALUES = ("super_admin", "member")


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    username = db.Column(db.String(80), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="member")
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    __table_args__ = (
        db.CheckConstraint("role IN ('super_admin','member')", name="ck_user_role_valid"),
        db.Index("ix_users_username", "username"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User {self.username!r}>"
