"""Shared pytest fixtures.

Runs against TestingConfig (TEST_DATABASE_URL, a real PostgreSQL database -
see backend/.env.example). Each test runs inside a transaction-scoped app
context with tables created fresh and dropped afterward.
"""
import pytest
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db as _db
from app.models import Person, Relationship, RelationshipType, User


@pytest.fixture()
def app():
    flask_app = create_app("testing")
    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def db(app):
    return _db


@pytest.fixture()
def super_admin(db):
    user = User(
        username="admin",
        password_hash=generate_password_hash("admin"),
        role="super_admin",
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture()
def member_user(db):
    user = User(
        username="member",
        password_hash=generate_password_hash("member123"),
        role="member",
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture()
def auth_headers(client, super_admin):
    response = client.post(
        "/api/auth/login", json={"username": "admin", "password": "admin"}
    )
    assert response.status_code == 200, response.get_json()
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def member_headers(client, member_user):
    response = client.post(
        "/api/auth/login", json={"username": "member", "password": "member123"}
    )
    assert response.status_code == 200, response.get_json()
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def relationship_type(db):
    rt = RelationshipType(
        name="Friend", color="#06B6D4", icon="users", description="Friendly."
    )
    db.session.add(rt)
    db.session.commit()
    return rt


@pytest.fixture()
def make_person(db):
    def _make_person(**overrides):
        defaults = {"display_name": "Test Person"}
        defaults.update(overrides)
        person = Person(**defaults)
        db.session.add(person)
        db.session.commit()
        return person

    return _make_person


@pytest.fixture()
def make_relationship(db, relationship_type):
    def _make_relationship(person_a, person_b, **overrides):
        defaults = {
            "person_a_id": person_a.id,
            "person_b_id": person_b.id,
            "relationship_type_id": relationship_type.id,
            "status": "active",
        }
        defaults.update(overrides)
        rel = Relationship(**defaults)
        db.session.add(rel)
        db.session.commit()
        return rel

    return _make_relationship
