"""Tests for /api/activity and the activity trail behind it."""


def get_log(client, auth_headers, **params):
    query = "&".join(f"{key}={value}" for key, value in params.items())
    response = client.get(f"/api/activity?{query}", headers=auth_headers)
    assert response.status_code == 200, response.get_json()
    return response.get_json()


def test_members_cannot_read_the_activity_log(client, member_headers):
    # Who signed in and who changed what isn't members' business.
    assert client.get("/api/activity", headers=member_headers).status_code == 403


def test_activity_log_requires_auth(client):
    assert client.get("/api/activity").status_code == 401


def test_signing_in_is_recorded(client, auth_headers):
    entries = get_log(client, auth_headers, action="login")["items"]

    assert len(entries) == 1
    assert entries[0]["username"] == "admin"
    assert entries[0]["entity_type"] == "session"


def test_sign_in_updates_the_account_s_last_login(client, auth_headers):
    users = client.get("/api/users", headers=auth_headers).get_json()
    admin = next(u for u in users if u["username"] == "admin")

    assert admin["last_login_at"] is not None


def test_an_account_that_never_signed_in_has_no_last_login(
    client, auth_headers, member_user
):
    users = client.get("/api/users", headers=auth_headers).get_json()
    member = next(u for u in users if u["username"] == "member")

    assert member["last_login_at"] is None


def test_creating_a_person_is_recorded_with_their_name(client, auth_headers):
    client.post("/api/people", json={"display_name": "Logged Person"}, headers=auth_headers)

    entry = get_log(client, auth_headers, action="create")["items"][0]
    assert entry["entity_type"] == "person"
    assert entry["summary"] == "Logged Person"
    assert entry["username"] == "admin"


def test_deleting_a_person_records_the_name_it_had(client, auth_headers, make_person):
    person = make_person(display_name="Since Deleted")
    client.delete(f"/api/people/{person.id}", headers=auth_headers)

    entry = get_log(client, auth_headers, action="delete")["items"][0]
    # The row is gone, so the log is the only place this name still exists.
    assert entry["summary"] == "Since Deleted"
    assert entry["entity_id"] == str(person.id)


def test_relationship_changes_are_recorded_readably(
    client, auth_headers, make_person, relationship_type
):
    a = make_person(display_name="Amy")
    b = make_person(display_name="Ben")

    client.post(
        "/api/relationships",
        json={
            "person_a_id": str(a.id),
            "person_b_id": str(b.id),
            "relationship_type_id": str(relationship_type.id),
        },
        headers=auth_headers,
    )

    entry = get_log(client, auth_headers, action="create")["items"][0]
    assert entry["entity_type"] == "relationship"
    assert "Amy" in entry["summary"] and "Ben" in entry["summary"]
    assert relationship_type.name in entry["summary"]


def test_failed_actions_are_not_recorded(client, auth_headers):
    before = get_log(client, auth_headers)["total"]

    # Rejected by validation, so nothing happened to log.
    assert client.post("/api/people", json={}, headers=auth_headers).status_code == 422

    assert get_log(client, auth_headers)["total"] == before


def test_member_activity_is_recorded_too(client, auth_headers, member_headers):
    client.post("/api/people", json={"display_name": "By Member"}, headers=member_headers)

    entry = get_log(client, auth_headers, action="create")["items"][0]
    assert entry["username"] == "member"


def test_the_log_survives_deleting_the_account_that_wrote_it(
    client, auth_headers, member_headers, member_user
):
    client.post("/api/people", json={"display_name": "By Member"}, headers=member_headers)
    client.delete(f"/api/users/{member_user.id}", headers=auth_headers)

    entry = next(
        e
        for e in get_log(client, auth_headers, action="create")["items"]
        if e["summary"] == "By Member"
    )
    # Name kept, link dropped - so it still says who did it.
    assert entry["username"] == "member"
    assert entry["user_id"] is None
    assert entry["user_exists"] is False


def test_newest_entries_come_first(client, auth_headers):
    client.post("/api/people", json={"display_name": "First"}, headers=auth_headers)
    client.post("/api/people", json={"display_name": "Second"}, headers=auth_headers)

    summaries = [e["summary"] for e in get_log(client, auth_headers, action="create")["items"]]
    assert summaries[:2] == ["Second", "First"]


def test_filtering_by_action(client, auth_headers, make_person):
    make_person(display_name="Untouched")
    client.post("/api/people", json={"display_name": "Created"}, headers=auth_headers)

    logins = get_log(client, auth_headers, action="login")["items"]
    creates = get_log(client, auth_headers, action="create")["items"]

    assert all(e["action"] == "login" for e in logins)
    assert all(e["action"] == "create" for e in creates)


def test_rejects_an_unknown_action_filter(client, auth_headers):
    assert client.get("/api/activity?action=nonsense", headers=auth_headers).status_code == 422
