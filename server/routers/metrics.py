"""Resource Utilization Telemetry Metrics Router."""

from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import CloudInstance, InstanceMetric, User
from server.schemas import InstanceMetricsResponse, InstanceMetricOut
from server.security import get_current_user
from server.services.cloud_adapter import CloudProviderAdapter

router = APIRouter(tags=["Metrics"])


@router.get("/instances/{instance_id}/metrics", response_model=InstanceMetricsResponse)
def get_instance_metrics(
    instance_id: str,
    time_range: Optional[str] = Query(
        "1h", description="Time range (e.g., 1h, 6h, 24h, 7d)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve telemetry metrics for an instance."""
    instance = db.query(CloudInstance).filter(CloudInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance with ID {instance_id} not found",
        )

    # Determine delta
    hours = 1
    if time_range == "6h":
        hours = 6
    elif time_range == "24h" or time_range == "1d":
        hours = 24
    elif time_range == "7d":
        hours = 24 * 7

    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

    metrics = (
        db.query(InstanceMetric)
        .filter(
            InstanceMetric.instance_id == instance_id,
            InstanceMetric.timestamp >= cutoff,
        )
        .order_by(InstanceMetric.timestamp.desc())
        .limit(50)
        .all()
    )

    # If no metrics exist yet, generate fresh telemetry point
    if not metrics:
        fresh_data = CloudProviderAdapter.generate_current_metrics(instance_id)
        metric = InstanceMetric(
            instance_id=instance_id,
            timestamp=datetime.now(timezone.utc),
            cpu_utilization_pct=fresh_data["cpu_utilization_pct"],
            memory_utilization_pct=fresh_data["memory_utilization_pct"],
            disk_read_bytes_sec=fresh_data["disk_read_bytes_sec"],
            network_in_bytes_sec=fresh_data["network_in_bytes_sec"],
        )
        db.add(metric)
        db.commit()
        db.refresh(metric)
        metrics = [metric]

    # Convert to schema
    metric_outs = [
        InstanceMetricOut(
            id=m.id,
            instance_id=m.instance_id,
            timestamp=m.timestamp,
            cpu_utilization_pct=m.cpu_utilization_pct,
            memory_utilization_pct=m.memory_utilization_pct,
            disk_read_bytes_sec=m.disk_read_bytes_sec,
            network_in_bytes_sec=m.network_in_bytes_sec,
        )
        for m in metrics
    ]

    return InstanceMetricsResponse(
        instance_id=instance_id,
        metrics=metric_outs,
    )


@router.post(
    "/instances/{instance_id}/metrics",
    response_model=InstanceMetricOut,
    status_code=status.HTTP_201_CREATED,
)
def record_instance_metric(
    instance_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and record a live metric sample for an instance."""
    instance = db.query(CloudInstance).filter(CloudInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance with ID {instance_id} not found",
        )

    data = CloudProviderAdapter.generate_current_metrics(instance_id)
    metric = InstanceMetric(
        instance_id=instance_id,
        timestamp=datetime.now(timezone.utc),
        cpu_utilization_pct=data["cpu_utilization_pct"],
        memory_utilization_pct=data["memory_utilization_pct"],
        disk_read_bytes_sec=data["disk_read_bytes_sec"],
        network_in_bytes_sec=data["network_in_bytes_sec"],
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)

    return InstanceMetricOut(
        id=metric.id,
        instance_id=metric.instance_id,
        timestamp=metric.timestamp,
        cpu_utilization_pct=metric.cpu_utilization_pct,
        memory_utilization_pct=metric.memory_utilization_pct,
        disk_read_bytes_sec=metric.disk_read_bytes_sec,
        network_in_bytes_sec=metric.network_in_bytes_sec,
    )
