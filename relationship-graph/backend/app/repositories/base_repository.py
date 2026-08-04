"""Generic repository: query logic only, no business rules."""
from typing import Generic, TypeVar

from app.extensions import db

ModelT = TypeVar("ModelT", bound=db.Model)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, model: type[ModelT]):
        self.model = model

    def get_by_id(self, entity_id) -> ModelT | None:
        return db.session.get(self.model, entity_id)

    def list_all(self):
        return db.session.query(self.model).all()

    def add(self, entity: ModelT) -> ModelT:
        db.session.add(entity)
        db.session.commit()
        return entity

    def update(self, entity: ModelT) -> ModelT:
        db.session.commit()
        return entity

    def delete(self, entity: ModelT) -> None:
        db.session.delete(entity)
        db.session.commit()

    @staticmethod
    def paginate(query, page: int, per_page: int):
        return query.paginate(page=page, per_page=per_page, error_out=False)
