import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status

from app.core.config import settings


class SlidingWindowRateLimiter:
    """Thread-safe in-memory sliding-window rate limiter keyed by scope and client IP."""

    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str, max_requests: int, window_seconds: int) -> None:
        now = time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            bucket = self._buckets[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again shortly.",
                )
            bucket.append(now)

    def reset(self) -> None:
        with self._lock:
            self._buckets.clear()


rate_limiter = SlidingWindowRateLimiter()


def enforce_auth_rate_limit(request: Request) -> None:
    """FastAPI dependency enforcing sliding-window rate limits on auth routes."""
    enabled = getattr(
        request.app.state, "rate_limit_enabled", settings.RATE_LIMIT_ENABLED
    )
    if not enabled:
        return

    max_requests = getattr(
        request.app.state,
        "auth_rate_limit_requests",
        settings.AUTH_RATE_LIMIT_REQUESTS,
    )
    window_seconds = getattr(
        request.app.state,
        "auth_rate_limit_window_seconds",
        settings.AUTH_RATE_LIMIT_WINDOW_SECONDS,
    )
    client_host = request.client.host if request.client else "unknown"
    key = f"auth:{request.url.path}:{client_host}"
    rate_limiter.check(key, max_requests=max_requests, window_seconds=window_seconds)
