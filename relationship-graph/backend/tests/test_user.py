"""Tests for /api/users (super admin only account management)."""


def test_list_users_requires_super_admin(client, member_headers):
    response = client.get("/api/users", headers=member_headers)
    assert response.status_code == 403


def test_list_users_as_super_admin(client, auth_headers, member_user):
    response = client.get("/api/users", headers=auth_headers)
    assert response.status_code == 200
    usernames = [u["username"] for u in response.get_json()]
    assert "admin" in usernames
    assert "member" in usernames


def test_create_user(client, auth_headers):
    response = client.post(
        "/api/users",
        json={"username": "newbie", "password": "hunter22", "role": "member"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body["username"] == "newbie"
    assert body["role"] == "member"
    assert body["is_active"] is True
    assert "password" not in body


def test_create_user_rejects_duplicate_username(client, auth_headers, member_user):
    response = client.post(
        "/api/users",
        json={"username": "member", "password": "hunter22"},
        headers=auth_headers,
    )
    assert response.status_code == 409


def test_create_user_requires_super_admin(client, member_headers):
    response = client.post(
        "/api/users",
        json={"username": "newbie", "password": "hunter22"},
        headers=member_headers,
    )
    assert response.status_code == 403


def test_disable_user_blocks_their_login(client, auth_headers, member_user):
    response = client.patch(
        f"/api/users/{member_user.id}",
        json={"is_active": False},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.get_json()["is_active"] is False

    login = client.post(
        "/api/auth/login", json={"username": "member", "password": "member123"}
    )
    assert login.status_code == 401


def test_cannot_delete_own_account(client, auth_headers, super_admin):
    response = client.delete(f"/api/users/{super_admin.id}", headers=auth_headers)
    assert response.status_code == 409


def test_cannot_remove_last_active_super_admin(client, auth_headers, super_admin):
    response = client.patch(
        f"/api/users/{super_admin.id}",
        json={"role": "member"},
        headers=auth_headers,
    )
    assert response.status_code == 409


def test_delete_user(client, auth_headers, member_user):
    response = client.delete(f"/api/users/{member_user.id}", headers=auth_headers)
    assert response.status_code == 204

    remaining = client.get("/api/users", headers=auth_headers).get_json()
    assert "member" not in [u["username"] for u in remaining]
