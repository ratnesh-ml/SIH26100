"""Thread-safe sliding-window rate limiter for FastAPI endpoints."""

from collections import defaultdict, deque
import threading
import time
from typing import Callable, Optional
from fastapi import HTTPException, Request, status


class SlidingWindowRateLimiter:
    """In-memory thread-safe sliding-window rate limiter."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        self._records: dict[str, deque[float]] = defaultdict(deque)

    def is_allowed(self, key: str) -> tuple[bool, int]:
        """Check if request for given key is allowed.
        
        Returns:
            (is_allowed, retry_after_seconds)
        """
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            queue = self._records[key]
            # Evict timestamps outside current sliding window
            while queue and queue[0] < window_start:
                queue.popleft()

            if len(queue) >= self.max_requests:
                earliest = queue[0]
                retry_after = max(1, int(earliest + self.window_seconds - now))
                return False, retry_after

            queue.append(now)
            return True, 0

    def reset(self, key: Optional[str] = None):
        """Reset records for testing or administrative actions."""
        with self._lock:
            if key is not None:
                self._records.pop(key, None)
            else:
                self._records.clear()


# Pre-instantiated rate limiters for core vectors
auth_login_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)
general_api_limiter = SlidingWindowRateLimiter(max_requests=120, window_seconds=60)


def create_rate_limiter_dependency(
    limiter: SlidingWindowRateLimiter,
    key_func: Optional[Callable[[Request], str]] = None,
):
    """Factory creating a FastAPI dependency enforcing rate limits."""
    def _dependency(request: Request):
        if key_func:
            key = key_func(request)
        else:
            # Default to client host IP, fallback to header or unknown
            client_ip = request.client.host if request.client else "unknown"
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()
            key = f"{request.url.path}:{client_ip}"

        allowed, retry_after = limiter.is_allowed(key)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: Maximum {limiter.max_requests} requests per {limiter.window_seconds}s. Please retry in {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )

    return _dependency
