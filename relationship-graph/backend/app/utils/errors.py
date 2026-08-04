"""Centralized API error handling."""
from flask import Flask, jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.exceptions import HTTPException


class APIError(Exception):
    """Raised by services/repositories for domain-level errors with an HTTP status."""

    def __init__(self, message: str, status_code: int = 400, payload: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}

    def to_dict(self) -> dict:
        return {"error": self.message, **self.payload}


class NotFoundError(APIError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class ConflictError(APIError):
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, status_code=409)


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(APIError)
    def handle_api_error(err: APIError):
        return jsonify(err.to_dict()), err.status_code

    @app.errorhandler(ValidationError)
    def handle_validation_error(err: ValidationError):
        return jsonify({"error": "Validation failed", "details": err.messages}), 422

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(err: IntegrityError):
        app.logger.warning("Integrity error: %s", err)
        return jsonify({"error": "Database constraint violated"}), 409

    @app.errorhandler(SQLAlchemyError)
    def handle_db_error(err: SQLAlchemyError):
        app.logger.exception("Database error")
        return jsonify({"error": "Database error"}), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(err: HTTPException):
        return jsonify({"error": err.description}), err.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(err: Exception):
        app.logger.exception("Unhandled exception")
        return jsonify({"error": "Internal server error"}), 500
