"""Tests for /api/people."""


def test_create_person_requires_display_name(client, auth_headers):
    response = client.post("/api/people", json={}, headers=auth_headers)
    assert response.status_code == 422


def test_create_and_get_person(client, auth_headers):
    create = client.post(
        "/api/people",
        json={"display_name": "Alice", "gender": "female", "country": "Thailand"},
        headers=auth_headers,
    )
    assert create.status_code == 201
    person_id = create.get_json()["id"]

    profile = client.get(f"/api/people/{person_id}", headers=auth_headers)
    assert profile.status_code == 200
    body = profile.get_json()
    assert body["person"]["display_name"] == "Alice"
    assert body["relationships"] == []
    assert body["stats"]["total_relationships"] == 0


def test_get_nonexistent_person_is_404(client, auth_headers):
    response = client.get(
        "/api/people/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )
    assert response.status_code == 404


def test_create_person_rejects_invalid_gender(client, auth_headers):
    response = client.post(
        "/api/people",
        json={"display_name": "Bad Gender", "gender": "not-a-real-value"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_update_person_partial(client, auth_headers, make_person):
    person = make_person(display_name="Original Name")
    response = client.put(
        f"/api/people/{person.id}",
        json={"nickname": "Nicky"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["display_name"] == "Original Name"
    assert body["nickname"] == "Nicky"


def test_members_may_add_and_edit_but_not_delete_people(
    client, member_headers, make_person
):
    person = make_person(display_name="Kept")

    created = client.post(
        "/api/people", json={"display_name": "Added by member"}, headers=member_headers
    )
    assert created.status_code == 201

    edited = client.put(
        f"/api/people/{person.id}", json={"nickname": "Nicky"}, headers=member_headers
    )
    assert edited.status_code == 200

    # Deleting cascades to their relationships, so it's super admin only.
    deleted = client.delete(f"/api/people/{person.id}", headers=member_headers)
    assert deleted.status_code == 403


def test_delete_person(client, auth_headers, make_person):
    person = make_person(display_name="To Delete")
    response = client.delete(f"/api/people/{person.id}", headers=auth_headers)
    assert response.status_code == 204
    assert client.get(f"/api/people/{person.id}", headers=auth_headers).status_code == 404


def test_delete_person_cascades_relationships(
    client, auth_headers, make_person, make_relationship
):
    a = make_person(display_name="A")
    b = make_person(display_name="B")
    rel = make_relationship(a, b)
    rel_id = rel.id

    client.delete(f"/api/people/{a.id}", headers=auth_headers)

    response = client.get(f"/api/relationships/{rel_id}", headers=auth_headers)
    assert response.status_code == 404


def test_search_matches_display_name_and_discord(client, auth_headers, make_person):
    make_person(display_name="Searchable Sam", discord="sam#1234")
    make_person(display_name="Other Person", discord="other#0001")

    by_name = client.get("/api/people?search=Searchable", headers=auth_headers)
    assert by_name.get_json()["total"] == 1

    by_discord = client.get("/api/people?search=sam%231234", headers=auth_headers)
    assert by_discord.get_json()["total"] == 1


def test_pagination_respects_per_page_and_max(client, auth_headers, make_person):
    for i in range(5):
        make_person(display_name=f"Person {i}")

    page = client.get("/api/people?per_page=2&page=1", headers=auth_headers)
    body = page.get_json()
    assert len(body["items"]) == 2
    assert body["pages"] == 3

    over_max = client.get("/api/people?per_page=1000", headers=auth_headers)
    assert over_max.status_code == 422
