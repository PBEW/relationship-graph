"""Tests for /api/relationships."""


def test_create_relationship(client, auth_headers, make_person, relationship_type):
    a = make_person(display_name="A")
    b = make_person(display_name="B")

    response = client.post(
        "/api/relationships",
        json={
            "person_a_id": str(a.id),
            "person_b_id": str(b.id),
            "relationship_type_id": str(relationship_type.id),
            "status": "active",
            "start_date": "2024-01-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body["person_a"]["display_name"] == "A"
    assert body["relationship_type"]["name"] == "Friend"


def test_self_relationship_is_rejected(client, auth_headers, make_person, relationship_type):
    a = make_person(display_name="A")
    response = client.post(
        "/api/relationships",
        json={
            "person_a_id": str(a.id),
            "person_b_id": str(a.id),
            "relationship_type_id": str(relationship_type.id),
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_end_date_before_start_date_is_rejected(
    client, auth_headers, make_person, relationship_type
):
    a = make_person(display_name="A")
    b = make_person(display_name="B")
    response = client.post(
        "/api/relationships",
        json={
            "person_a_id": str(a.id),
            "person_b_id": str(b.id),
            "relationship_type_id": str(relationship_type.id),
            "start_date": "2024-06-01",
            "end_date": "2024-01-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_nonexistent_person_reference_is_rejected(client, auth_headers, make_person, relationship_type):
    a = make_person(display_name="A")
    response = client.post(
        "/api/relationships",
        json={
            "person_a_id": str(a.id),
            "person_b_id": "00000000-0000-0000-0000-000000000000",
            "relationship_type_id": str(relationship_type.id),
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_filter_by_person_id(client, auth_headers, make_person, make_relationship):
    a = make_person(display_name="A")
    b = make_person(display_name="B")
    c = make_person(display_name="C")
    make_relationship(a, b)
    make_relationship(a, c)

    response = client.get(f"/api/relationships?person_id={a.id}", headers=auth_headers)
    body = response.get_json()
    assert body["total"] == 2


def test_filter_by_status(client, auth_headers, make_person, make_relationship):
    a = make_person(display_name="A")
    b = make_person(display_name="B")
    c = make_person(display_name="C")
    make_relationship(a, b, status="active")
    make_relationship(a, c, status="ended")

    active = client.get("/api/relationships?status=active", headers=auth_headers)
    assert active.get_json()["total"] == 1


def test_update_relationship_status(client, auth_headers, make_person, make_relationship):
    a = make_person(display_name="A")
    b = make_person(display_name="B")
    rel = make_relationship(a, b, status="active")

    response = client.put(
        f"/api/relationships/{rel.id}",
        json={"status": "ended", "end_date": "2024-12-31"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.get_json()["status"] == "ended"


def test_delete_relationship(client, auth_headers, make_person, make_relationship):
    a = make_person(display_name="A")
    b = make_person(display_name="B")
    rel = make_relationship(a, b)

    response = client.delete(f"/api/relationships/{rel.id}", headers=auth_headers)
    assert response.status_code == 204
    assert client.get(f"/api/relationships/{rel.id}", headers=auth_headers).status_code == 404
