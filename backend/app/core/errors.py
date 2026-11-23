"""Stable domain exceptions mapped to safe HTTP error responses."""

from __future__ import annotations


class DomainError(Exception):
    code = "domain_error"
    status_code = 400

    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.details = details


class ValidationFailed(DomainError):
    code = "validation_failed"


class NotFound(DomainError):
    code = "not_found"
    status_code = 404


class Conflict(DomainError):
    code = "conflict"
    status_code = 409


class Unauthorized(DomainError):
    code = "unauthorized"
    status_code = 401


class Forbidden(DomainError):
    code = "forbidden"
    status_code = 403


class TooManyRequests(DomainError):
    code = "rate_limited"
    status_code = 429
