import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Request


class RateLimiter:
    """Sliding-window request limiter keyed by an arbitrary string (e.g. client IP)."""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> tuple[bool, int]:
        """Returns (allowed, retry_after_seconds). Records the hit if allowed."""
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window_seconds:
                hits.popleft()
            if len(hits) >= self.max_requests:
                retry_after = int(self.window_seconds - (now - hits[0])) + 1
                return False, retry_after
            hits.append(now)
            return True, 0


def get_client_ip(request: Request) -> str:
    # mtm-frontend's nginx sets X-Forwarded-For via proxy_add_x_forwarded_for, so the
    # first entry is the real client (later entries are proxy hops). Falls back to
    # request.client for local/direct runs with no proxy in front.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
