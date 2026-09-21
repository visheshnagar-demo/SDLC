from typing import List, Dict, Any
from pydantic import BaseModel


class TimeSeriesPoint(BaseModel):
    timestamp: str
    avg_latency_ms: float
    p95_latency_ms: float
    uptime_pct: float
    probe_count: int
    failure_count: int


class MetricsSummary(BaseModel):
    timeframe: str
    total_probes: int
    uptime_pct: float
    avg_latency_ms: float
    p95_latency_ms: float
    failure_count: int
    time_series: List[Dict[str, Any]]
