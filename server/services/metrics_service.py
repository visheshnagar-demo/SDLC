import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from server.models.health_log_model import HealthLog
from server.schemas.metrics_schema import MetricsSummary, TimeSeriesPoint
from server.schemas.api_schema import ApiStats24h


def calculate_p95(values: list[float]) -> float:
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    idx = int(len(sorted_vals) * 0.95)
    if idx >= len(sorted_vals):
        idx = len(sorted_vals) - 1
    return round(sorted_vals[idx], 2)


class MetricsService:
    @staticmethod
    def get_api_24h_stats(db: Session, api_id: str) -> ApiStats24h:
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        since = now - datetime.timedelta(hours=24)

        logs = (
            db.query(HealthLog)
            .filter(HealthLog.api_id == api_id, HealthLog.checked_at >= since)
            .all()
        )

        total_probes = len(logs)
        if total_probes == 0:
            return ApiStats24h(
                uptime_pct=100.0,
                avg_latency_ms=0.0,
                total_probes=0,
                failure_count=0,
            )

        failures = sum(1 for log in logs if not log.is_success)
        successes = total_probes - failures
        uptime_pct = round((successes / total_probes) * 100, 2)
        avg_latency = round(sum(log.latency_ms for log in logs) / total_probes, 2)

        return ApiStats24h(
            uptime_pct=uptime_pct,
            avg_latency_ms=avg_latency,
            total_probes=total_probes,
            failure_count=failures,
        )

    @staticmethod
    def get_api_metrics(
        db: Session, api_id: str, timeframe: str = "24h"
    ) -> MetricsSummary:
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

        if timeframe == "7d":
            time_delta = datetime.timedelta(days=7)
            bucket_duration = datetime.timedelta(hours=6)
        elif timeframe == "30d":
            time_delta = datetime.timedelta(days=30)
            bucket_duration = datetime.timedelta(days=1)
        else:
            timeframe = "24h"
            time_delta = datetime.timedelta(hours=24)
            bucket_duration = datetime.timedelta(hours=1)

        since = now - time_delta

        logs = (
            db.query(HealthLog)
            .filter(HealthLog.api_id == api_id, HealthLog.checked_at >= since)
            .order_by(HealthLog.checked_at.asc())
            .all()
        )

        total_probes = len(logs)
        if total_probes == 0:
            return MetricsSummary(
                timeframe=timeframe,
                total_probes=0,
                failure_count=0,
                uptime_pct=100.0,
                avg_latency_ms=0.0,
                p95_latency_ms=0.0,
                time_series=[],
            )

        failures = sum(1 for log in logs if not log.is_success)
        successes = total_probes - failures
        uptime_pct = round((successes / total_probes) * 100, 2)
        latencies = [log.latency_ms for log in logs]
        avg_latency_ms = round(sum(latencies) / total_probes, 2)
        p95_latency_ms = calculate_p95(latencies)

        # Generate buckets
        time_series: list[TimeSeriesPoint] = []
        current_bucket_start = since
        while current_bucket_start < now:
            current_bucket_end = current_bucket_start + bucket_duration
            bucket_logs = [
                log
                for log in logs
                if current_bucket_start <= log.checked_at < current_bucket_end
            ]

            b_total = len(bucket_logs)
            if b_total > 0:
                b_failures = sum(1 for l in bucket_logs if not l.is_success)
                b_successes = b_total - b_failures
                b_uptime = round((b_successes / b_total) * 100, 2)
                b_latencies = [l.latency_ms for l in bucket_logs]
                b_avg_lat = round(sum(b_latencies) / b_total, 2)
                b_p95_lat = calculate_p95(b_latencies)
            else:
                b_uptime = 100.0
                b_avg_lat = 0.0
                b_p95_lat = 0.0
                b_failures = 0
                b_successes = 0

            time_series.append(
                TimeSeriesPoint(
                    timestamp=current_bucket_start,
                    avg_latency_ms=b_avg_lat,
                    p95_latency_ms=b_p95_lat,
                    uptime_pct=b_uptime,
                    total_probes=b_total,
                    successful_probes=b_successes,
                )
            )
            current_bucket_start = current_bucket_end

        return MetricsSummary(
            timeframe=timeframe,
            total_probes=total_probes,
            failure_count=failures,
            uptime_pct=uptime_pct,
            avg_latency_ms=avg_latency_ms,
            p95_latency_ms=p95_latency_ms,
            time_series=time_series,
        )

    @staticmethod
    def get_global_failures(
        db: Session, limit: int = 20, offset: int = 0
    ) -> tuple[list[HealthLog], int]:
        query = (
            db.query(HealthLog)
            .filter(HealthLog.is_success == False)  # noqa: E712
            .order_by(desc(HealthLog.checked_at))
        )
        total = query.count()
        items = query.offset(offset).limit(limit).all()
        return items, total


metrics_service = MetricsService()
