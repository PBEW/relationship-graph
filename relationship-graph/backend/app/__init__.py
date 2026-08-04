"""Flask application factory."""
import os

from flask import Flask, send_from_directory

from app.config import get_config
from app.extensions import cors, db, jwt, migrate
from app.utils.errors import register_error_handlers


def create_app(env_name: str | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(env_name))

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from app import models  # noqa: F401  (registers tables on db.metadata)

    register_error_handlers(app)

    from app.api import register_blueprints

    register_blueprints(app)

    @app.get("/uploads/<path:filename>")
    def uploaded_file(filename: str):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    return app
