"""RelationshipType model — a lookup/reference table (Friend, Dating, Enemy, ...)."""
import uuid

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class RelationshipType(db.Model):
    __tablename__ = "relationship_types"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = db.Column(db.String(50), nullable=False, unique=True)
    color = db.Column(db.String(7), nullable=False)  # hex, e.g. #22D3EE
    icon = db.Column(db.String(50), nullable=False)  # lucide-react icon name
    description = db.Column(db.Text, nullable=True)

    relationships = db.relationship(
        "Relationship", back_populates="relationship_type", passive_deletes=True
    )

    __table_args__ = (
        db.CheckConstraint(
            "color ~ '^#[0-9A-Fa-f]{6}$'", name="ck_relationship_type_color_hex"
        ),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<RelationshipType {self.name!r}>"
