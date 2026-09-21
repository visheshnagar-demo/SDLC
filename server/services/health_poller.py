import json
import time
import datetime
import asyncio
from typing import Optional
import httpx
from sqlalchemy.orm import Session
from server.models.api_model import ApiEndpoint
from server.models.health_log_model import HealthLog


SENSITIVE_HEADER_KEYS = {
    "authorization",
    "x-api-key",
    "cookie",
    "set-cookie",
    "proxy-authorization",
    "token",
}


def mask_headers(headers: Optional[dict[str, str]]) -> Optional[dict[str, str]]:
    if not headers:
        return None
    masked = {}
    for k, v in headers.items():
        if k.lower() in SENSITIVE_HEADER_KEYS:
            masked[k] = "******"
        else:
            masked[k] = v
    return masked


class HealthPoller:
    @staticmethod
    async def probe_endpoint(
        api: ApiEndpoint,
        db: Session,
        client: Optional[httpx.AsyncClient] = None,
    ) -> HealthLog:
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

        req_headers = {}
        if api.request_headers:
            if isinstance(api.request_headers, str):
                try:
                    req_headers = json.loads(api.request_headers)
                except Exception:
                    req_headers = {}
            elif isinstance(api.request_headers, dict):
                req_headers = api.request_headers

        method = (api.http_method or "GET").upper()
        url = api.target_url
        timeout = float(api.timeout_seconds or 5.0)
        expected_status = int(api.expected_status or 200)

        should_close_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=timeout, verify=False)
            should_close_client = True

        start_time = time.perf_counter()
        response_status: Optional[int] = None
        response_body: Optional[str] = None
        error_message: Optional[str] = None
        operational_status = "Down"
        is_success = False

        try:
            if method == "POST":
                resp = await client.post(
                    url,
                    headers=req_headers,
                    content=api.request_body.encode("utf-8")
                    if api.request_body
                    else None,
                )
            elif method == "HEAD":
                resp = await client.head(url, headers=req_headers)
            else:
                resp = await client.get(url, headers=req_headers)

            end_time = time.perf_counter()
            latency_ms = round((end_time - start_time) * 1000, 2)
            response_status = resp.status_code

            if resp.text:
                response_body = resp.text[:2048]

            if response_status == expected_status:
                degraded_threshold = timeout * 500  # e.g., 5.0s * 500 = 2500ms
                if latency_ms > degraded_threshold:
                    operational_status = "Degraded"
                else:
                    operational_status = "Healthy"
                is_success = True
            else:
                operational_status = "Down"
                is_success = False
                error_message = (
                    f"Expected status {expected_status}, received {response_status}"
                )

        except httpx.TimeoutException as e:
            end_time = time.perf_counter()
            latency_ms = round((end_time - start_time) * 1000, 2)
            operational_status = "Down"
            is_success = False
            error_message = f"Request timed out after {timeout}s: {str(e)}"
        except Exception as e:
            end_time = time.perf_counter()
            latency_ms = round((end_time - start_time) * 1000, 2)
            operational_status = "Down"
            is_success = False
            error_message = f"Connection error: {str(e)}"
        finally:
            if should_close_client:
                await client.aclose()

        # Update API record
        api.current_status = operational_status
        api.last_latency_ms = latency_ms
        api.last_checked_at = now

        masked_headers_json = None
        if req_headers:
            masked_headers_json = json.dumps(mask_headers(req_headers))

        log = HealthLog(
            api_id=api.id,
            response_status=response_status,
            latency_ms=latency_ms,
            operational_status=operational_status,
            is_success=is_success,
            error_message=error_message,
            request_headers=masked_headers_json,
            response_body=response_body,
            checked_at=now,
        )

        db.add(log)
        db.commit()
        db.refresh(log)
        db.refresh(api)

        return log

    @staticmethod
    async def poll_all_active(db: Session) -> list[HealthLog]:
        active_apis = db.query(ApiEndpoint).filter(ApiEndpoint.is_active == True).all()  # noqa: E712
        if not active_apis:
            return []

        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            tasks = [
                HealthPoller.probe_endpoint(api, db, client=client)
                for api in active_apis
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        successful_logs = [r for r in results if isinstance(r, HealthLog)]
        return successful_logs


health_poller = HealthPoller()
