"""Provider webhooks. Signatures are verified before any state change; browser
redirects never mark an order paid."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from ...core.config import settings
from ...core.db import get_db
from ...core.security import verify_webhook_signature
from ...services import payments

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db), stripe_signature: str | None = Header(default=None, alias="Stripe-Signature")):
    import json

    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Payments are not configured")
    body = await request.body()
    if not stripe_signature or not verify_webhook_signature(body, stripe_signature, settings.stripe_webhook_secret):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")
    try:
        event = json.loads(body)
        event_id = event["id"]
        event_type = event["type"]
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed event") from exc
    result = payments.handle_event(db, event=event, event_id=event_id, event_type=event_type)
    db.commit()
    return {"received": True, **result}
