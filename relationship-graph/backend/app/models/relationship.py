"""Relationship model — an edge between two people, typed and time-bounded."""
import uuid

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db
from app.models.base import TimestampMixin

STATUS_VALUES = ("active", "ended")


class Relationship(TimestampMixin, db.Model):
    __tablename__ = "relationships"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    person_a_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("people.id", ondelete="CASCADE"), nullable=False
    )
    person_b_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("people.id", ondelete="CASCADE"), nullable=False
    )
    relationship_type_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("relationship_types.id", ondelete="RESTRICT"),
        nullable=False,
    )

    status = db.Column(db.String(20), nullable=False, default="active", server_default="active")
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    note = db.Column(db.Text, nullable=True)

    person_a = db.relationship(
        "Person", foreign_keys=[person_a_id], back_populates="relationships_as_a"
    )
    person_b = db.relationship(
        "Person", foreign_keys=[person_b_id], back_populates="relationships_as_b"
    )
    relationship_type = db.relationship("RelationshipType", back_populates="relationships")

    __table_args__ = (
        db.CheckConstraint("person_a_id <> person_b_id", name="ck_relationship_not_self"),
        db.CheckConstraint("status IN ('active','ended')", name="ck_relationship_status_valid"),
        db.CheckConstraint(
            "end_date IS NULL OR start_date IS NULL OR end_date >= start_date",
            name="ck_relationship_date_order",
        ),
        db.Index("ix_relationships_person_a", "person_a_id"),
        db.Index("ix_relationships_person_b", "person_b_id"),
        db.Index("ix_relationships_pair", "person_a_id", "person_b_id"),
        db.Index("ix_relationships_type", "relationship_type_id"),
        db.Index("ix_relationships_status", "status"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Relationship {self.person_a_id} -> {self.person_b_id}>"
