"""Tests for avatar upload and serving."""
import io

from PIL import Image

from app.models import Avatar


def make_image_bytes(size=(64, 64), fmt="PNG") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, color=(120, 80, 200)).save(buffer, fmt)
    return buffer.getvalue()


def upload(client, auth_headers, person, filename="face.png", content=None):
    return client.post(
        f"/api/people/{person.id}/avatar",
        data={"avatar": (io.BytesIO(content or make_image_bytes()), filename)},
        content_type="multipart/form-data",
        headers=auth_headers,
    )


def test_upload_stores_the_image_and_points_the_person_at_it(
    client, auth_headers, db, make_person
):
    person = make_person(display_name="Has Avatar")

    response = upload(client, auth_headers, person)
    assert response.status_code == 200

    avatar_url = response.get_json()["avatar"]
    assert avatar_url.startswith("/api/avatars/")
    assert db.session.query(Avatar).count() == 1


def test_uploaded_avatar_is_served_back(client, auth_headers, make_person):
    person = make_person(display_name="Has Avatar")
    avatar_url = upload(client, auth_headers, person).get_json()["avatar"]

    served = client.get(avatar_url)
    assert served.status_code == 200
    assert served.mimetype == "image/png"
    # Round-trips as a real image rather than whatever bytes came in.
    assert Image.open(io.BytesIO(served.data)).size == (64, 64)
    assert "immutable" in served.headers["Cache-Control"]


def test_avatars_are_served_without_a_token(client, auth_headers, make_person):
    # A plain <img src> can't send an Authorization header, so this route has
    # to stay open even though the rest of the API doesn't.
    person = make_person(display_name="Has Avatar")
    avatar_url = upload(client, auth_headers, person).get_json()["avatar"]

    assert client.get(avatar_url).status_code == 200


def test_oversized_images_are_downscaled(client, auth_headers, make_person):
    person = make_person(display_name="Big Picture")
    huge = make_image_bytes(size=(2000, 1000))

    avatar_url = upload(client, auth_headers, person, content=huge).get_json()["avatar"]

    served = client.get(avatar_url)
    width, height = Image.open(io.BytesIO(served.data)).size
    assert max(width, height) == 512
    # Aspect ratio preserved.
    assert width == 512 and height == 256


def test_replacing_an_avatar_discards_the_old_one(client, auth_headers, db, make_person):
    person = make_person(display_name="Changes Often")

    first_url = upload(client, auth_headers, person).get_json()["avatar"]
    second_url = upload(client, auth_headers, person).get_json()["avatar"]

    assert first_url != second_url
    assert db.session.query(Avatar).count() == 1
    assert client.get(first_url).status_code == 404
    assert client.get(second_url).status_code == 200


def test_deleting_a_person_discards_their_avatar(
    client, auth_headers, db, make_person
):
    person = make_person(display_name="Going Away")
    avatar_url = upload(client, auth_headers, person).get_json()["avatar"]

    assert client.delete(f"/api/people/{person.id}", headers=auth_headers).status_code == 204
    assert db.session.query(Avatar).count() == 0
    assert client.get(avatar_url).status_code == 404


def test_non_image_content_is_rejected(client, auth_headers, db, make_person):
    person = make_person(display_name="Nice Try")

    response = upload(client, auth_headers, person, content=b"not an image at all")
    assert response.status_code == 400
    assert db.session.query(Avatar).count() == 0


def test_disallowed_file_type_is_rejected(client, auth_headers, make_person):
    person = make_person(display_name="Nice Try")

    response = upload(client, auth_headers, person, filename="payload.svg")
    assert response.status_code == 400


def test_unknown_avatar_is_404(client):
    response = client.get("/api/avatars/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
