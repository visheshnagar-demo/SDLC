import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from server.database import SessionLocal
from server.models import TenantConfig

# In-memory sliding window store: tenant_id -> list of timestamps
_rate_limit_store = defaultdict(list)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        tenant_id = getattr(request.state, "tenant_id", None)

        if tenant_id:
            now = time.time()
            window_start = now - 60.0

            # Get tenant config rate limit
            db = SessionLocal()
            try:
                config = (
                    db.query(TenantConfig)
                    .filter(TenantConfig.tenant_id == tenant_id)
                    .first()
                )
                rate_limit_rpm = config.rate_limit_rpm if config else 1000
            finally:
                db.close()

            # Clean up timestamps older than 60 seconds
            timestamps = [
                ts for ts in _rate_limit_store[tenant_id] if ts > window_start
            ]
            _rate_limit_store[tenant_id] = timestamps

            if len(timestamps) >= rate_limit_rpm:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Too many requests."},
                )

            _rate_limit_store[tenant_id].append(now)

        response = await call_next(request)
        return response
