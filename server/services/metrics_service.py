import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from server.models.health_log_model import HealthLogModel
from server.schemas.metrics_schema import MetricsSummary


def calculate_percentile(values: List[float], percentile: float) -> float:
    """Calculate the given percentile (e.g. 95) from a list of float numbers."""
    if not values:
        return 0.0
    sorted_values = sorted(values)
    k = (len(sorted_values) - 1) * (percentile / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return round(sorted_values[int(k)], 2)
    d0 = sorted_values[int(f)] * (c - k)
    d1 = sorted_values[int(c)] * (k - f)
    return round(d0 + d1, 2)


def get_24h_api_stats(db: Session, api_id: str) -> Dict[str, Any]:
    """Retrieve summarized 24-hour health telemetry stats for an API."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=24)

    logs = (
        db.query(HealthLogModel)
        .filter(HealthLogModel.api_id == api_id, HealthLogModel.checked_at >= cutoff)
        .order_by(HealthLogModel.checked_at.asc())
        .all()
    )

    total_checks = len(logs)
    if total_checks == 0:
        return {
            "total_checks": 0,
            "uptime_pct": 100.0,
            "avg_latency_ms": 0.0,
            "p95_latency_ms": 0.0,
            "failure_count": 0,
            "min_latency_ms": 0.0,
            "max_latency_ms": 0.0,
        }

    successful = [l for l in logs if l.is_success]
    failures = total_checks - len(successful)
    latencies = [l.latency_ms for l in logs]
    uptime_pct = round((len(successful) / total_checks) * 100.0, 2)
    avg_latency = round(sum(latencies) / total_checks, 2)
    p95_latency = calculate_percentile(latencies, 95)

    return {
        "total_checks": total_checks,
        "uptime_pct": uptime_pct,
        "avg_latency_ms": avg_latency,
        "p95_latency_ms": p95_latency,
        "failure_count": failures,
        "min_latency_ms": round(min(latencies), 2) if latencies else 0.0,
        "max_latency_ms": round(max(latencies), 2) if latencies else 0.0,
    }


def compute_api_metrics(
    db: Session, api_id: str, timeframe: str = "24h"
) -> MetricsSummary:
    """Compute aggregated metrics and bucketed time-series data for the given timeframe."""
    now = datetime.now(timezone.utc)
    tf = timeframe.lower().strip()

    if tf == "7d":
        cutoff = now - timedelta(days=7)
        bucket_size = timedelta(hours=6)
        num_buckets = 28
    elif tf == "30d":
        cutoff = now - timedelta(days=30)
        bucket_size = timedelta(days=1)
        num_buckets = 30
    else:
        tf = "24h"
        cutoff = now - timedelta(hours=24)
        bucket_size = timedelta(hours=1)
        num_buckets = 24

    logs = (
        db.query(HealthLogModel)
        .filter(HealthLogModel.api_id == api_id, HealthLogModel.checked_at >= cutoff)
        .order_by(HealthLogModel.checked_at.asc())
        .all()
    )

    total_probes = len(logs)
    if total_probes == 0:
        # Generate empty time-series buckets
        empty_series: List[Dict[str, Any]] = []
        for i in range(num_buckets):
            bucket_time = cutoff + (bucket_size * i)
            empty_series.append(
                {
                    "timestamp": bucket_time.isoformat(),
                    "avg_latency_ms": 0.0,
                    "p95_latency_ms": 0.0,
                    "uptime_pct": 100.0,
                    "probe_count": 0,
                    "failure_count": 0,
                }
            )
        return MetricsSummary(
            timeframe=tf,
            total_probes=0,
            uptime_pct=100.0,
            avg_latency_ms=0.0,
            p95_latency_ms=0.0,
            failure_count=0,
            time_series=empty_series,
        )

    successful = [l for l in logs if l.is_success]
    failure_count = total_probes - len(successful)
    all_latencies = [l.latency_ms for l in logs]
    uptime_pct = round((len(successful) / total_probes) * 100.0, 2)
    avg_latency = round(sum(all_latencies) / total_probes, 2)
    p95_latency = calculate_percentile(all_latencies, 95)

    # Bucket logs into intervals
    buckets: List[List[HealthLogModel]] = [[] for _ in range(num_buckets)]
    for log in logs:
        # Ensure log.checked_at is timezone-aware
        log_time = log.checked_at
        if log_time.tzinfo is None:
            log_time = log_time.replace(tzinfo=timezone.utc)

        offset = log_time - cutoff
        bucket_idx = int(offset.total_seconds() // bucket_size.total_seconds())
        if 0 <= bucket_idx < num_buckets:
            buckets[bucket_idx].append(log)
        elif bucket_idx >= num_buckets:
            buckets[-1].append(log)

    time_series: List[Dict[str, Any]] = []
    for i in range(num_buckets):
        bucket_time = cutoff + (bucket_size * i)
        b_logs = buckets[i]
        if not b_logs:
            time_series.append(
                {
                    "timestamp": bucket_time.isoformat(),
                    "avg_latency_ms": 0.0,
                    "p95_latency_ms": 0.0,
                    "uptime_pct": 100.0,
                    "probe_count": 0,
                    "failure_count": 0,
                }
            )
        else:
            b_total = len(b_logs)
            b_success = len([l for l in b_logs if l.is_success])
            b_failures = b_total - b_success
            b_latencies = [l.latency_ms for l in b_logs]
            b_uptime = round((b_success / b_total) * 100.0, 2)
            b_avg = round(sum(b_latencies) / b_total, 2)
            b_p95 = calculate_percentile(b_latencies, 95)

            time_series.append(
                {
                    "timestamp": bucket_time.isoformat(),
                    "avg_latency_ms": b_avg,
                    "p95_latency_ms": b_p95,
                    "uptime_pct": b_uptime,
                    "probe_count": b_total,
                    "failure_count": b_failures,
                }
            )

    return MetricsSummary(
        timeframe=tf,
        total_probes=total_probes,
        uptime_pct=uptime_pct,
        avg_latency_ms=avg_latency,
        p95_latency_ms=p95_latency,
        failure_count=failure_count,
        time_series=time_series,
    )
