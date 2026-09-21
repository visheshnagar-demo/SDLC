import asyncio
import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
import httpx
from sqlalchemy.orm import Session
from server.models.api_model import APIModel
from server.models.health_log_model import HealthLogModel
from server.database import SessionLocal

logger = logging.getLogger(__name__)


async def probe_single_api(db: Session, api_obj: APIModel) -> HealthLogModel:
    """Execute a single HTTP probe against the target API endpoint and persist the result."""
    now = datetime.now(timezone.utc)
    start_time = time.perf_counter()
    response_status: Optional[int] = None
    latency_ms: float = 0.0
    operational_status: str = "Down"
    is_success: bool = False
    error_message: Optional[str] = None
    response_body_preview: Optional[str] = None

    headers: Dict[str, str] = {}
    if api_obj.request_headers and isinstance(api_obj.request_headers, dict):
        headers = {str(k): str(v) for k, v in api_obj.request_headers.items()}

    timeout = float(api_obj.timeout_seconds or 5.0)
    method = (api_obj.http_method or "GET").upper()

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            if method == "POST":
                req_data = api_obj.request_body
                if req_data:
                    resp = await client.post(
                        api_obj.target_url, content=req_data, headers=headers
                    )
                else:
                    resp = await client.post(api_obj.target_url, headers=headers)
            elif method == "HEAD":
                resp = await client.head(api_obj.target_url, headers=headers)
            else:
                resp = await client.get(api_obj.target_url, headers=headers)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            latency_ms = round(elapsed_ms, 2)
            response_status = resp.status_code

            # Status classification
            expected = int(api_obj.expected_status or 200)
            if response_status == expected:
                # Degraded threshold: response slower than 500ms or 50% of timeout
                degraded_threshold = max(500.0, timeout * 500.0)
                if latency_ms > degraded_threshold:
                    operational_status = "Degraded"
                    is_success = True
                    error_message = f"High response latency ({latency_ms}ms > {degraded_threshold}ms threshold)"
                else:
                    operational_status = "Healthy"
                    is_success = True
            else:
                operational_status = "Down"
                is_success = False
                error_message = (
                    f"Received HTTP status {response_status} (expected {expected})"
                )

            # Capture response preview for failures or degraded
            if resp.text:
                response_body_preview = resp.text[:2048]

    except httpx.TimeoutException:
        latency_ms = round(timeout * 1000.0, 2)
        operational_status = "Down"
        is_success = False
        error_message = f"Connection timed out after {timeout} seconds"
    except httpx.ConnectError as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        operational_status = "Down"
        is_success = False
        error_message = f"Connection failed: {str(e)}"
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        operational_status = "Down"
        is_success = False
        error_message = f"Request error: {str(e)}"

    # Update API record
    api_obj.current_status = operational_status
    api_obj.last_latency_ms = latency_ms
    api_obj.last_checked_at = now

    # Save log entry
    log_entry = HealthLogModel(
        api_id=api_obj.id,
        response_status=response_status,
        latency_ms=latency_ms,
        operational_status=operational_status,
        is_success=is_success,
        error_message=error_message,
        request_headers=api_obj.request_headers,
        response_body=response_body_preview,
        checked_at=now,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    db.refresh(api_obj)
    return log_entry


async def run_polling_cycle() -> None:
    """Scan all active APIs and trigger health probes for endpoints due for a check."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        active_apis = db.query(APIModel).filter(APIModel.is_active.is_(True)).all()
        tasks = []
        for api_obj in active_apis:
            interval = timedelta(seconds=api_obj.interval_seconds or 60)
            if (
                api_obj.last_checked_at is None
                or (now - api_obj.last_checked_at) >= interval
            ):
                tasks.append(probe_single_api(db, api_obj))

        if tasks:
            logger.info(f"Dispatching {len(tasks)} concurrent API health probes...")
            await asyncio.gather(*tasks, return_exceptions=True)
    except Exception as e:
        logger.error(f"Error during health polling cycle: {e}")
    finally:
        db.close()


async def start_background_poller(poll_interval: int = 15) -> None:
    """Continuous background loop executing health polling cycles."""
    logger.info("Starting background health poller worker...")
    while True:
        try:
            await run_polling_cycle()
        except asyncio.CancelledError:
            logger.info("Background health poller cancelled.")
            break
        except Exception as e:
            logger.error(f"Unexpected error in background health poller: {e}")
        await asyncio.sleep(poll_interval)
