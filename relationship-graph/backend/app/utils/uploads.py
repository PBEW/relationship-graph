"""Validation and normalisation of uploaded avatar images.

Produces bytes for the caller to persist (see models/avatar.py for why they
go in the database rather than on disk).
"""
import io

from flask import current_app
from PIL import Image, UnidentifiedImageError
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.utils.errors import APIError

MAX_AVATAR_DIMENSION = 512

# Pillow's format names, and the mimetype each is served back as.
_FORMAT_BY_EXTENSION = {
    "png": ("PNG", "image/png"),
    "jpg": ("JPEG", "image/jpeg"),
    "jpeg": ("JPEG", "image/jpeg"),
    "gif": ("GIF", "image/gif"),
    "webp": ("WEBP", "image/webp"),
}


def _allowed(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["ALLOWED_AVATAR_EXTENSIONS"]


def process_avatar(file: FileStorage) -> tuple[bytes, str]:
    """Validate, downscale and re-encode an upload. Returns (data, mimetype).

    The image is decoded rather than trusted by extension, so a renamed
    executable can't ride in as a .png.
    """
    if not file or not file.filename:
        raise APIError("No file provided", status_code=400)
    if not _allowed(file.filename):
        allowed = ", ".join(sorted(current_app.config["ALLOWED_AVATAR_EXTENSIONS"]))
        raise APIError(f"File type not allowed. Allowed: {allowed}", status_code=400)

    ext = secure_filename(file.filename).rsplit(".", 1)[-1].lower()
    pil_format, mimetype = _FORMAT_BY_EXTENSION[ext]

    try:
        image = Image.open(file.stream)
        image.verify()
        file.stream.seek(0)
        image = Image.open(file.stream)
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise APIError("File is not a valid image", status_code=400) from exc

    # Downscale oversized avatars to cut storage/bandwidth - never upscales.
    image.thumbnail((MAX_AVATAR_DIMENSION, MAX_AVATAR_DIMENSION), Image.LANCZOS)

    if pil_format == "JPEG" and image.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image.convert("RGBA"), mask=image.convert("RGBA").split()[-1])
        image = background

    save_kwargs = {"optimize": True}
    if pil_format == "JPEG":
        save_kwargs["quality"] = 85

    buffer = io.BytesIO()
    image.save(buffer, format=pil_format, **save_kwargs)
    return buffer.getvalue(), mimetype
