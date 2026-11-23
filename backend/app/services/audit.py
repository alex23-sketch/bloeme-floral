"""Audit trail writer."""

from __future__ import annotations

import json

from sqlalchemy.orm import Session

from ..models import AdminUser, AuditEvent
from ..models.base import utcnow


def record(
    db: Session,
    *,
    actor: AdminUser | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    summary: str = "",
    detail: dict | None = None,
    ip: str = "",
) -> AuditEvent:
    event = AuditEvent(
        actor_id=actor.id if actor else None,
        actor_email=actor.email if actor else "system",
        action=action[:80],
        resource_type=resource_type[:60],
        resource_id=resource_id,
        summary=summary[:400],
        detail=json.dumps(detail or {}, default=str)[:8000],
        ip_address=ip[:64],
        created_at=utcnow(),
    )
    db.add(event)
    return event
