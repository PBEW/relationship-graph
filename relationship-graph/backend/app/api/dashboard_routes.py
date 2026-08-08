"""Dashboard statistics endpoint."""
from flask import Blueprint, jsonify

from app.services.dashboard_service import DashboardService
from app.utils.auth_decorators import login_required

dashboard_bp = Blueprint("dashboard", __name__)
service = DashboardService()


@dashboard_bp.get("/stats")
@login_required
def get_stats():
    return jsonify(service.get_stats())
