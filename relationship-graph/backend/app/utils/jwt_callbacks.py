"""Flask-JWT-Extended callback registration: clean JSON error bodies + revocation checks."""
from flask import Flask, jsonify


def register_jwt_callbacks(app: Flask, jwt) -> None:
    from app.services.auth_service import AuthService

    service = AuthService()

    @jwt.token_in_blocklist_loader
    def check_if_revoked(jwt_header, jwt_payload):
        return service.is_revoked(jwt_payload["jti"])

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"error": "Authorization token required", "details": reason}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": "Invalid token", "details": reason}), 422

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    @jwt.revoked_token_loader
    def revoked_token(jwt_header, jwt_payload):
        return jsonify({"error": "Token has been revoked"}), 401
