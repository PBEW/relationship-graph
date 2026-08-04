"""Serialization helper for Flask-SQLAlchemy Pagination objects."""
from flask_sqlalchemy.pagination import Pagination


def paginated_response(pagination: Pagination, item_schema) -> dict:
    return {
        "items": item_schema.dump(pagination.items, many=True),
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    }
