"""Avatar model — an uploaded profile image, stored as bytes in the database.

Deliberately *not* on disk: the app is hosted on a platform whose filesystem
is wiped on every deploy, so file-backed avatars disappeared each time. The
database is the only durable store available, and at 512x512 (see
utils/uploads.py) a whole community's avatars is a few megabytes.

Rows are immutable - re-uploading creates a new one and deletes the old -
which is what lets the serving route cache them forever.
"""
import uuid

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db
from app.models.base import TimestampMixin


class Avatar(TimestampMixin, db.Model):
    __tablename__ = "avatars"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    mimetype = db.Column(db.String(50), nullable=False)
    data = db.Column(db.LargeBinary, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Avatar {self.id} {self.mimetype}>"
