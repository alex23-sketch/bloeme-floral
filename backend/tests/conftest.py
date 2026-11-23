"""Test harness: isolated SQLite database, in-process FastAPI client."""
from __future__ import annotations

import os
import tempfile
from pathlib import Path

import pytest

from app.core.ratelimit import limiter

DB_DIR = tempfile.mkdtemp(prefix="bloeme-test-")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{Path(DB_DIR) / 'test.db'}"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-definitely-long-enough"
os.environ["PAYMENTS_MODE"] = "demo"
os.environ["TRUSTED_ORIGINS"] = "http://testserver"
os.environ["MEDIA_ROOT"] = str(Path(DB_DIR) / "media")
os.environ["RATE_LIMIT_PER_MINUTE"] = "10000"

import httpx  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.db import Base, SessionLocal, engine  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
import app.models  # noqa: E402,F401


@pytest.fixture()
def db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    with TestClient(fastapi_app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_rate_limits():
    limiter.reset()
    yield
    limiter.reset()
