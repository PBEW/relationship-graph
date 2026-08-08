"""Tests for /api/relationship-types."""


def test_create_relationship_type(client, auth_headers):
    response = client.post(
        "/api/relationship-types",
        json={"name": "Rival", "color": "#DC2626", "icon": "swords", "description": "Rivals."},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.get_json()["name"] == "Rival"


def test_create_rejects_invalid_hex_color(client, auth_headers):
    response = client.post(
        "/api/relationship-types",
        json={"name": "Bad", "color": "blue", "icon": "star"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_create_rejects_duplicate_name(client, auth_headers, relationship_type):
    response = client.post(
        "/api/relationship-types",
        json={"name": relationship_type.name, "color": "#000000", "icon": "star"},
        headers=auth_headers,
    )
    assert response.status_code == 409


def test_delete_type_in_use_is_blocked(
    client, auth_headers, relationship_type, make_person, make_relationship
):
    a = make_person(display_name="A")
    b = make_person(display_name="B")
    make_relationship(a, b)

    response = client.delete(
        f"/api/relationship-types/{relationship_type.id}", headers=auth_headers
    )
    assert response.status_code == 409


def test_delete_unused_type_succeeds(client, auth_headers, relationship_type):
    response = client.delete(
        f"/api/relationship-types/{relationship_type.id}", headers=auth_headers
    )
    assert response.status_code == 204


def test_members_may_create_but_not_delete_types(
    client, member_headers, relationship_type
):
    created = client.post(
        "/api/relationship-types",
        json={"name": "Roommate", "color": "#06B6D4", "icon": "home"},
        headers=member_headers,
    )
    assert created.status_code == 201

    deleted = client.delete(
        f"/api/relationship-types/{relationship_type.id}", headers=member_headers
    )
    assert deleted.status_code == 403


def test_list_types(client, auth_headers, relationship_type):
    response = client.get("/api/relationship-types", headers=auth_headers)
    assert response.status_code == 200
    names = [t["name"] for t in response.get_json()]
    assert relationship_type.name in names
