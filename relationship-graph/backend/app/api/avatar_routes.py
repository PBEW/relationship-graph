"""Avatar image serving."""
from flask import Blueprint, Response

from app.repositories.avatar_repository import AvatarRepository
from app.utils.errors import NotFoundError

avatar_bp = Blueprint("avatars", __name__)
repo = AvatarRepository()


# Intentionally unauthenticated: browsers can't attach an Authorization header
# to a plain <img src>, so requiring a token here would break every avatar in
# the app. Ids are random UUIDs that only appear in authenticated responses,
# so an image is only reachable by someone who was already handed its URL.
@avatar_bp.get("/<uuid:avatar_id>")
def get_avatar(avatar_id):
    avatar = repo.get_by_id(avatar_id)
    if not avatar:
        raise NotFoundError("Avatar not found")

    response = Response(avatar.data, mimetype=avatar.mimetype)
    # Rows are never edited in place - a new upload mints a new id - so the
    # bytes behind a given URL can never change.
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response
