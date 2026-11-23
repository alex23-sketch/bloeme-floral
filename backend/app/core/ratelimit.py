"""In-process sliding-window rate limiter.

Suitable for a single API instance (the default Docker deployment). For
multi-instance deployments, front the API with a reverse proxy that also
enforces limits, or swap this for a Redis-backed implementation.
"""

from __future__ import annotations

import threading
import time
from collections import deque


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def hit(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        now = time.monotonic()
        with self._lock:
            q = self._hits.setdefault(key, deque())
            while q and now - q[0] > window_seconds:
                q.popleft()
            if len(q) >= limit:
                retry = max(1, int(window_seconds - (now - q[0])))
                return False, retry
            q.append(now)
            return True, 0

    def reset(self, prefix: str | None = None) -> None:
        with self._lock:
            if prefix is None:
                self._hits.clear()
                return
            for key in list(self._hits):
                if key.startswith(prefix):
                    del self._hits[key]


limiter = SlidingWindowLimiter()
