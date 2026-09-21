from datetime import datetime
from pydantic import BaseModel


class TimeSeriesPoint(BaseModel):
    timestamp: datetime
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    uptime_pct: float = 100.0
    total_probes: int = 0
    successful_probes: int = 0


class MetricsSummary(BaseModel):
    timeframe: str = "24h"
    total_probes: int = 0
    failure_count: int = 0
    uptime_pct: float = 100.0
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    time_series: list[TimeSeriesPoint] = []
