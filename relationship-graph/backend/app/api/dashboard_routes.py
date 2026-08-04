"""Dashboard statistics endpoint."""
from flask import Blueprint, jsonify

from app.services.dashboard_service import DashboardService

dashboard_bp = Blueprint("dashboard", __name__)
service = DashboardService()


@dashboard_bp.get("/stats")
def get_stats():
    return jsonify(service.get_stats())
