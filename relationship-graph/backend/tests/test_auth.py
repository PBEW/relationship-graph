"""Tests for /api/auth/*."""


def test_login_success_returns_tokens(client):
    response = client.post(
        "/api/auth/login", json={"username": "admin", "password": "admin"}
    )
    assert response.status_code == 200
    body = response.get_json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_login_wrong_password_is_rejected(client):
    response = client.post(
        "/api/auth/login", json={"username": "admin", "password": "wrong"}
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
    assert response.get_json()["username"] == "admin"


def test_refresh_requires_refresh_token(client, auth_headers):
    # auth_headers carries an access token, not a refresh token
    response = client.post("/api/auth/refresh", headers=auth_headers)
    assert response.status_code == 422


def test_refresh_issues_new_access_token(client):
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


def test_get_routes_are_public(client):
    response = client.get("/api/people")
    assert response.status_code == 200
