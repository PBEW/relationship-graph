"""API blueprint registry.

Feature blueprints (auth, person, relationship, relationship_type, dashboard)
are added here in later phases as they are implemented.
"""
from flask import Blueprint, Flask, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    return jsonify({"status": "ok"})


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(health_bp, url_prefix="/api")
