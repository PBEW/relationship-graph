"""Tests for /api/auth/*."""
from werkzeug.security import generate_password_hash

from app.models import User


def test_login_success_returns_tokens(client, super_admin):
    response = client.post(
        "/api/auth/login", json={"username": "admin", "password": "admin"}
    )
    assert response.status_code == 200
    body = response.get_json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_login_wrong_password_is_rejected(client, super_admin):
    response = client.post(
        "/api/auth/login", json={"username": "admin", "password": "wrong"}
    )
    assert response.status_code == 401


def test_login_unknown_username_is_rejected(client):
    response = client.post(
        "/api/auth/login", json={"username": "nobody", "password": "whatever"}
    )
    assert response.status_code == 401


def test_login_disabled_account_is_rejected(client, db):
    user = User(
        username="disabled",
        password_hash=generate_password_hash("pw1234"),
        role="member",
        is_active=False,
    )
    db.session.add(user)
    db.session.commit()

    response = client.post(
        "/api/auth/login", json={"username": "disabled", "password": "pw1234"}
    )
    assert response.status_code == 401


def test_login_missing_fields_is_validation_error(client):
    response = client.post("/api/auth/login", json={"username": "admin"})
    assert response.status_code == 422


def test_me_requires_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_with_valid_token(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["username"] == "admin"
    assert body["role"] == "super_admin"


def test_disabling_account_blocks_existing_token(client, db, member_user, member_headers):
    member_user.is_active = False
    db.session.commit()

    response = client.get("/api/auth/me", headers=member_headers)
    assert response.status_code == 401


def test_refresh_requires_refresh_token(client, auth_headers):
    # auth_headers carries an access token, not a refresh token
    response = client.post("/api/auth/refresh", headers=auth_headers)
    assert response.status_code == 422


def test_refresh_issues_new_access_token(client, super_admin):
    login = client.post(
        "/api/auth/login", json={"username": "admin", "password": "admin"}
    )
    refresh_token = login.get_json()["refresh_token"]
    response = client.post(
        "/api/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"}
    )
    assert response.status_code == 200
    assert "access_token" in response.get_json()


def test_logout_revokes_the_access_token(client, auth_headers):
    logout = client.post("/api/auth/logout", headers=auth_headers)
    assert logout.status_code == 200

    reused = client.get("/api/auth/me", headers=auth_headers)
    assert reused.status_code == 401


def test_mutating_person_route_requires_auth(client):
    response = client.post("/api/people", json={"display_name": "No Auth"})
    assert response.status_code == 401


def test_get_routes_require_auth(client):
    response = client.get("/api/people")
    assert response.status_code == 401


def test_get_routes_work_with_valid_token(client, auth_headers):
    response = client.get("/api/people", headers=auth_headers)
    assert response.status_code == 200
