"""Local avatar file storage."""
import os
import uuid

from flask import current_app
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.utils.errors import APIError


def _allowed(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["ALLOWED_AVATAR_EXTENSIONS"]


def save_avatar(file: FileStorage) -> str:
    if not file or not file.filename:
        raise APIError("No file provided", status_code=400)
    if not _allowed(file.filename):
        allowed = ", ".join(sorted(current_app.config["ALLOWED_AVATAR_EXTENSIONS"]))
        raise APIError(f"File type not allowed. Allowed: {allowed}", status_code=400)

    ext = secure_filename(file.filename).rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, filename))
    return f"/uploads/{filename}"


def delete_avatar(avatar_url: str | None) -> None:
    if not avatar_url or not avatar_url.startswith("/uploads/"):
        return
    filename = avatar_url.removeprefix("/uploads/")
    filename = secure_filename(filename)
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    if os.path.isfile(path):
        os.remove(path)
