"""Data access for Person."""
from sqlalchemy import func, or_

from app.extensions import db
from app.models.person import Person
from app.models.relationship import Relationship
from app.repositories.base_repository import BaseRepository


class PersonRepository(BaseRepository[Person]):
    def __init__(self):
        super().__init__(Person)

    def query(self, *, search: str | None = None, gender: str | None = None,
              country: str | None = None):
        q = db.session.query(Person)

        if search:
            like = f"%{search}%"
            q = q.filter(
                or_(
                    Person.display_name.ilike(like),
                    Person.nickname.ilike(like),
                    Person.vrchat_name.ilike(like),
                    Person.discord.ilike(like),
                    Person.steam.ilike(like),
                    Person.twitter.ilike(like),
                )
            )
        if gender:
            q = q.filter(Person.gender == gender)
        if country:
            q = q.filter(Person.country == country)

        return q.order_by(Person.display_name.asc())

    def most_connected(self, limit: int = 10):
        """People ranked by total relationship count (either side)."""
        counts = (
            db.session.query(
                Relationship.person_a_id.label("person_id"), func.count().label("cnt")
            )
            .group_by(Relationship.person_a_id)
            .union_all(
                db.session.query(
                    Relationship.person_b_id.label("person_id"), func.count().label("cnt")
                ).group_by(Relationship.person_b_id)
            )
            .subquery()
        )
        totals = (
            db.session.query(
                counts.c.person_id, func.sum(counts.c.cnt).label("total")
            )
            .group_by(counts.c.person_id)
            .subquery()
        )
        rows = (
            db.session.query(Person, totals.c.total)
            .join(totals, Person.id == totals.c.person_id)
            .order_by(totals.c.total.desc())
            .limit(limit)
            .all()
        )
        return [(person, int(total)) for person, total in rows]

    def recently_added(self, limit: int = 10):
        return (
            db.session.query(Person).order_by(Person.created_at.desc()).limit(limit).all()
        )

    def count(self) -> int:
        return db.session.query(func.count(Person.id)).scalar()
