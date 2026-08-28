"""Activity log endpoints - super admin only."""
from flask import Blueprint, jsonify, request

from app.schemas.activity_schema import activity_log_schema, activity_query_schema
from app.services.activity_service import ActivityService
from app.utils.auth_decorators import super_admin_required
from app.utils.pagination import paginated_response

activity_bp = Blueprint("activity", __name__)
service = ActivityService()


# Who signed in and who changed what is exactly the sort of thing members
# shouldn't be able to browse about each other.
@activity_bp.get("")
@super_admin_required
def list_activity():
    params = activity_query_schema.load(request.args)
    pagination = service.list_activity(**params)
    return jsonify(paginated_response(pagination, activity_log_schema))
