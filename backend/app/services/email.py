"""SMTP notifications with templates, delivery logging and retries.

A send is only reported as `sent` after the SMTP server accepted the message.
When SMTP is not configured the log row is `skipped` with an explicit reason;
callers must not infer delivery from an order status change alone.
"""

from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage
from string import Template

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models import AdminUser, EmailLog, EmailTemplate, Order
from ..models.base import iso, utcnow

DEFAULT_TEMPLATES = {
    "order_received": ("Order received", "Hello $customer_name,\n\nThank you for your order $order_number. We will confirm it shortly.\n\nTotal: $total\n"),
    "payment_confirmed": ("Payment confirmed — $order_number", "Hello $customer_name,\n\nYour payment for $order_number has been confirmed.\n\nTotal: $total\n"),
    "order_preparing": ("Your flowers are being prepared — $order_number", "Hello $customer_name,\n\nOur designers are preparing your arrangement for $delivery_date.\n"),
    "out_for_delivery": ("On the way — $order_number", "Hello $customer_name,\n\nYour flowers are out for delivery today.\n"),
    "order_cancelled": ("Your order was cancelled — $order_number", "Hello $customer_name,\n\nOrder $order_number has been cancelled. Any stock reserved has been released.\n"),
}


def seed_templates(db: Session) -> None:
    for key, (subject, body) in DEFAULT_TEMPLATES.items():
        if not db.scalar(select(EmailTemplate).where(EmailTemplate.key == key)):
            db.add(EmailTemplate(key=key, name=subject.split("—")[0].strip(), subject=subject, body=body))


def _assign(template: EmailTemplate, context: dict) -> tuple[str, str]:
    class _Safe(Template):
        pass

    return Template(template.subject).safe_substitute(context), Template(template.body).safe_substitute(context)


def send_transactional(db: Session, *, key: str, to: str, context: dict, order: Order | None = None) -> EmailLog:
    template = db.scalar(select(EmailTemplate).where(EmailTemplate.key == key))
    subject, body = (key, "") if not template else _assign(template, context)
    log = EmailLog(template_key=key, order_id=order.id if order else None, recipient=to, subject=subject, status="queued")
    db.add(log)
    db.flush()
    if template and not template.enabled:
        log.status = "skipped"
        log.last_error = "Template disabled"
        return log
    if not settings.smtp_enabled or not settings.smtp_host:
        log.status = "skipped"
        log.last_error = "SMTP is not configured"
        return log
    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        log.attempts += 1
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_starttls:
                smtp.starttls(context=ssl.create_default_context())
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password or "")
            smtp.send_message(msg)
        log.status = "sent"
        log.sent_at = utcnow()
    except Exception as exc:  # noqa: BLE001 - reported, never swallowed silently
        log.status = "failed"
        log.last_error = type(exc).__name__[:200]
    return log


def retry(db: Session, log: EmailLog) -> EmailLog:
    # Copy previous content and attempt again.
    template = db.scalar(select(EmailTemplate).where(EmailTemplate.key == log.template_key))
    if not template or not settings.smtp_enabled:
        log.last_error = "Retry unavailable: SMTP or template is not configured"
        return log
    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = log.recipient
    msg["Subject"] = log.subject
    msg.set_content(template.body)
    log.attempts += 1
    try:
        with smtplib.SMTP(settings.smtp_host or "", settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_starttls:
                smtp.starttls(context=ssl.create_default_context())
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password or "")
            smtp.send_message(msg)
        log.status = "sent"
        log.sent_at = utcnow()
    except Exception as exc:  # noqa: BLE001
        log.status = "failed"
        log.last_error = type(exc).__name__[:200]
    return log


def log_payload(log: EmailLog) -> dict:
    return {
        "id": log.id,
        "template_key": log.template_key,
        "recipient": log.recipient,
        "subject": log.subject,
        "status": log.status,
        "attempts": log.attempts,
        "last_error": log.last_error,
        "created_at": iso(log.created_at),
        "sent_at": iso(log.sent_at),
    }


_ = AdminUser  # keep import for type-checking symmetry
