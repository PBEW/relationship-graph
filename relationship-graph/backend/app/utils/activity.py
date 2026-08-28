"""Convenience wrapper so routes can record an activity in one line.

Called from the API layer rather than the services, because that's where the
current user is already resolved - threading it down through every service
method would touch far more code for no extra clarity.

Recording happens *after* the service call returns, so a failed action never
leaves a log entry claiming it happened.
"""
from app.services.activity_service import ActivityService
from app.utils.auth_decorators import get_current_user

_service = ActivityService()


def record_activity(action: str, entity_type: str, entity_id=None, summary: str | None = None):
    return _service.record(
        get_current_user(), action, entity_type, entity_id=entity_id, summary=summary
    )
