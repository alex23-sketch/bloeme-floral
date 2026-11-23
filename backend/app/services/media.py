"""Safe media uploads.

Accepts only raster images (JPEG/PNG/WebP/AVIF) or hand-authored SVG under a
strict allow-list. Rejects HTML/SVG-with-script, path traversal, oversized
files and mismatched content types. Files are content-addressed on disk and
served with a hardened content type.
"""

from __future__ import annotations

import hashlib
import re
import struct
from dataclasses import dataclass

from ..core.config import settings


class UnsafeUpload(ValueError):
    pass


@dataclass(frozen=True)
class ValidatedImage:
    data: bytes
    content_type: str
    extension: str
    width: int | None
    height: int | None


SAFE_RASTER = {"image/jpeg", "image/png", "image/webp", "image/avif"}
SIGNATURES = {
    "image/jpeg": (b"\xff\xd8\xff", ".jpg"),
    "image/png": (b"\x89PNG\r\n\x1a\n", ".png"),
    "image/webp": (b"RIFF", ".webp"),
    "image/avif": (b"\x00\x00\x00", ".avif"),
}
SVG_FORBIDDEN = re.compile(rb"<\s*(script|foreignObject|iframe|object|embed|handler|set)\b|javascript:|on[a-z]+\s*=", re.I)


def _png_size(data: bytes) -> tuple[int, int] | None:
    if len(data) >= 24 and data[12:16] == b"IHDR":
        return struct.unpack(">II", data[16:24])
    return None


def validate_upload(data: bytes, declared_type: str, filename: str) -> ValidatedImage:
    if not data:
        raise UnsafeUpload("Empty file")
    if len(data) > settings.media_max_bytes:
        raise UnsafeUpload("File exceeds the maximum allowed size")
    if ".." in filename or "/" in filename or "\\" in filename or filename.startswith("."):
        raise UnsafeUpload("Unsafe filename")
    declared = (declared_type or "").split(";")[0].strip().lower()
    if declared not in settings.allowed_mime_types:
        raise UnsafeUpload(f"Content type {declared or 'unknown'} is not allowed")

    if declared == "image/svg+xml":
        head = data[:4096].lower()
        if b"<svg" not in head:
            raise UnsafeUpload("Not a valid SVG document")
        if SVG_FORBIDDEN.search(data):
            raise UnsafeUpload("SVG contains disallowed script or event attributes")
        return ValidatedImage(data=data, content_type=declared, extension=".svg", width=None, height=None)

    if declared not in SAFE_RASTER:
        raise UnsafeUpload("Unsupported image type")
    prefix, ext = SIGNATURES[declared]
    if declared == "image/webp":
        if not (data.startswith(b"RIFF") and data[8:12] == b"WEBP"):
            raise UnsafeUpload("File content does not match image/webp")
    elif declared == "image/avif":
        if b"ftyp" not in data[4:16]:
            raise UnsafeUpload("File content does not match image/avif")
    elif not data.startswith(prefix):
        raise UnsafeUpload(f"File content does not match {declared}")

    width = height = None
    if declared == "image/png":
        size = _png_size(data)
        if not size:
            raise UnsafeUpload("Malformed PNG")
        width, height = size
    return ValidatedImage(data=data, content_type=declared, extension=ext, width=width, height=height)


def store(data: bytes, extension: str) -> tuple[str, str]:
    """Write content-addressed file; return (stored_name, digest)."""
    import os

    digest = hashlib.sha256(data).hexdigest()
    stored = f"{digest[:32]}{extension}"
    root = os.path.abspath(settings.media_root)
    os.makedirs(os.path.join(root, "uploads"), exist_ok=True)
    target = os.path.join(root, "uploads", stored)
    if not os.path.exists(target):
        with open(target, "wb") as fh:
            fh.write(data)
    return stored, digest
