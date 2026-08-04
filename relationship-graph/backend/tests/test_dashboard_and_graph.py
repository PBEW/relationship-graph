"""Tests for /api/dashboard/stats and /api/graph."""


def test_dashboard_stats_shape_and_counts(client, make_person, make_relationship, relationship_type):
    a = make_person(display_name="A")
    b = make_person(display_name="B")
    make_relationship(a, b)

    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    body = response.get_json()
    assert body["total_people"] == 2
    assert body["total_relationships"] == 1
    assert any(d["name"] == relationship_type.name and d["count"] == 1 for d in body["relationship_distribution"])
    assert len(body["most_connected"]) == 2
    assert len(body["recently_added"]) == 2


def test_graph_endpoint_shape(client, make_person, make_relationship):
    a = make_person(display_name="A")
    b = make_person(display_name="B")
    rel = make_relationship(a, b)

    response = client.get("/api/graph")
    assert response.status_code == 200
    body = response.get_json()

    node_ids = {n["id"] for n in body["nodes"]}
    assert str(a.id) in node_ids
    assert str(b.id) in node_ids

    edge = next(e for e in body["edges"] if e["id"] == str(rel.id))
    assert edge["source"] == str(a.id)
    assert edge["target"] == str(b.id)
    assert "relationship_type" in edge
