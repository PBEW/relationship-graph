"""API blueprint registry."""
from flask import Blueprint, Flask, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    return jsonify({"status": "ok"})


def register_blueprints(app: Flask) -> None:
    from app.api.dashboard_routes import dashboard_bp
    from app.api.graph_routes import graph_bp
    from app.api.person_routes import person_bp
    from app.api.relationship_routes import relationship_bp
    from app.api.relationship_type_routes import relationship_type_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(person_bp, url_prefix="/api/people")
    app.register_blueprint(relationship_bp, url_prefix="/api/relationships")
    app.register_blueprint(relationship_type_bp, url_prefix="/api/relationship-types")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(graph_bp, url_prefix="/api/graph")
