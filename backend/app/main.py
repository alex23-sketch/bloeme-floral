"""BLOOMÉ FLORAL Business PRO API entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .api.v1 import admin, auth, checkout, customers, public, webhooks
from .core.config import settings
from .core.db import Base, engine
from .core.errors import DomainError

logger = logging.getLogger("bloeme.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_for_production()
    if settings.auto_create_tables and settings.environment != "production":
        import app.models  # noqa: F401

        Base.metadata.create_all(engine)
    Path(settings.media_root).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title=f"{settings.app_name} Business PRO API",
    version="1.0.0",
    description="Shared versioned API for Bloomé Floral web, admin CMS and future mobile clients.",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$",  # loopback-only regex; production still uses explicit trusted origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token", "Idempotency-Key", "Stripe-Signature"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if settings.is_production:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


@app.exception_handler(DomainError)
async def domain_error(_request: Request, exc: DomainError):
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}})


@app.exception_handler(Exception)
async def safe_error(_request: Request, exc: Exception):
    logger.exception("Unhandled API error")
    return JSONResponse(status_code=500, content={"error": {"code": "internal_error", "message": "An unexpected error occurred"}})


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "service": "bloeme-api", "version": app.version, "environment": settings.environment}


@app.get("/ready", tags=["system"])
async def ready():
    from sqlalchemy import text
    from .core.db import SessionLocal

    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "ok"}
    finally:
        db.close()


app.include_router(public.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(checkout.router, prefix=settings.api_prefix)
app.include_router(customers.router, prefix=settings.api_prefix)
app.include_router(webhooks.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)

media_path = Path(settings.media_root)
media_path.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_path)), name="media")
