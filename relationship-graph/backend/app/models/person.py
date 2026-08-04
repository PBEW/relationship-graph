"""Person model — a member of the online community."""
import uuid

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db
from app.models.base import TimestampMixin

GENDER_VALUES = ("male", "female", "non_binary", "other", "unspecified")


class Person(TimestampMixin, db.Model):
    __tablename__ = "people"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    avatar = db.Column(db.String(500), nullable=True)
    display_name = db.Column(db.String(120), nullable=False)
    nickname = db.Column(db.String(120), nullable=True)
    vrchat_name = db.Column(db.String(120), nullable=True)
    discord = db.Column(db.String(120), nullable=True)
    steam = db.Column(db.String(120), nullable=True)
    twitter = db.Column(db.String(120), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    birthday = db.Column(db.Date, nullable=True)
    bio = db.Column(db.Text, nullable=True)

    relationships_as_a = db.relationship(
        "Relationship",
        foreign_keys="Relationship.person_a_id",
        back_populates="person_a",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    relationships_as_b = db.relationship(
        "Relationship",
        foreign_keys="Relationship.person_b_id",
        back_populates="person_b",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        db.CheckConstraint(
            "gender IN ('male','female','non_binary','other','unspecified')",
            name="ck_person_gender_valid",
        ),
        db.Index("ix_people_display_name", "display_name"),
        db.Index("ix_people_nickname", "nickname"),
        db.Index("ix_people_vrchat_name", "vrchat_name"),
        db.Index("ix_people_discord", "discord"),
        db.Index("ix_people_steam", "steam"),
        db.Index("ix_people_twitter", "twitter"),
        db.Index("ix_people_country", "country"),
        db.Index("ix_people_gender", "gender"),
    )

    @property
    def relationships(self):
        """All relationships involving this person, regardless of side."""
        return list(self.relationships_as_a) + list(self.relationships_as_b)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Person {self.display_name!r}>"
