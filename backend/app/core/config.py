"""Application settings.

All configuration is environment-driven (12-factor). The defaults are safe for
local development only; `validate_for_production()` refuses to start a
production deployment with insecure or missing secrets.
"""

from __future__ import annotations

import secrets
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["development", "test", "production"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- identity -------------------------------------------------------
    app_name: str = "Bloomé Floral"
    environment: Environment = "development"
    api_prefix: str = "/api/v1"
    public_site_url: str = "http://localhost:5173"
    admin_site_url: str = "http://localhost:5173/admin"

    # --- database -------------------------------------------------------
    # PostgreSQL is the production default. SQLite is accepted only when
    # ENVIRONMENT is development/test.
    database_url: str = "postgresql+psycopg://bloeme:bloeme@localhost:5432/bloeme"
    database_echo: bool = False
    database_pool_size: int = 10
    database_max_overflow: int = 20
    auto_create_tables: bool = False  # development/test only; production uses Alembic

    # --- security -------------------------------------------------------
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(48))
    session_ttl_hours: int = 12
    session_cookie_name: str = "bloeme_session"
    csrf_cookie_name: str = "bloeme_csrf"
    cookie_secure: bool = False  # forced True in production
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    trusted_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    rate_limit_per_minute: int = 120
    login_max_attempts: int = 8
    login_window_minutes: int = 15

    # --- media ----------------------------------------------------------
    media_root: str = "backend/media"
    media_max_bytes: int = 8 * 1024 * 1024
    media_allowed_mime: str = "image/jpeg,image/png,image/webp,image/avif,image/svg+xml"

    # --- payments -------------------------------------------------------
    payments_mode: Literal["disabled", "demo", "stripe"] = "disabled"
    allow_demo_payments_in_production: bool = False
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_currency: str = "usd"
    stripe_api_base: str = "https://api.stripe.com"

    # --- email ----------------------------------------------------------
    smtp_enabled: bool = False
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "atelier@example.com"
    smtp_starttls: bool = True

    # --- store rules ----------------------------------------------------
    default_tax_rate_bp: int = 725  # basis points (7.25%)
    order_hold_minutes: int = 30

    @field_validator("database_url")
    @classmethod
    def _normalise_db_url(cls, value: str) -> str:
        # Accept the common `postgres://` shorthand (used by some hosts).
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        return value

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.trusted_origins.split(",") if origin.strip()]

    @property
    def allowed_mime_types(self) -> set[str]:
        return {m.strip().lower() for m in self.media_allowed_mime.split(",") if m.strip()}

    def validate_for_production(self) -> None:
        problems: list[str] = []
        if self.environment == "production":
            if len(self.secret_key) < 32:
                problems.append("SECRET_KEY must be at least 32 characters in production")
            if not self.cookie_secure:
                problems.append("COOKIE_SECURE must be true in production")
            if self.database_url.startswith("sqlite"):
                problems.append("SQLite is not permitted in production; use PostgreSQL")
            if "*" in self.allowed_origins:
                problems.append("TRUSTED_ORIGINS must list explicit origins in production")
            if self.payments_mode == "demo" and not self.allow_demo_payments_in_production:
                problems.append("PAYMENTS_MODE=demo must not be used in production unless ALLOW_DEMO_PAYMENTS_IN_PRODUCTION=true")
            if self.payments_mode == "stripe" and not (self.stripe_secret_key and self.stripe_webhook_secret):
                problems.append("Stripe mode requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET")
        if problems:
            raise RuntimeError("Unsafe configuration:\n- " + "\n- ".join(problems))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
