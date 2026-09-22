"""Cloud VM Instance Lifecycle & Telemetry router."""

import random
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from server.auth import get_current_user, require_admin
from server.database import get_db
from server.models import AuditLog, CloudInstance, CloudProvider, InstanceMetrics, User
from server.schemas import (
    CloudInstanceCreate,
    CloudInstanceResponse,
    InstanceActionRequest,
    InstanceActionResponse,
    InstanceMetricsResponse,
)

router = APIRouter(prefix="/instances", tags=["instances"])


@router.get("", response_model=List[CloudInstanceResponse])
def list_instances(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    provider_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List cloud VM instances with pagination and optional filters."""
    query = db.query(CloudInstance)
    if provider_id:
        query = query.filter(CloudInstance.provider_id == provider_id)
    if status_filter:
        query = query.filter(CloudInstance.status == status_filter.upper())

    instances = (
        query.order_by(CloudInstance.created_at.desc()).offset(skip).limit(limit).all()
    )
    return instances


@router.get("/{instance_id}", response_model=CloudInstanceResponse)
def get_instance(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get detailed instance metadata."""
    instance = db.query(CloudInstance).filter(CloudInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance with id '{instance_id}' not found",
        )
    return instance


@router.post(
    "", response_model=CloudInstanceResponse, status_code=status.HTTP_201_CREATED
)
def provision_instance(
    instance_in: CloudInstanceCreate,
    req: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Provision a new Cloud VM instance (Admin only)."""
    provider = (
        db.query(CloudProvider)
        .filter(CloudProvider.id == instance_in.provider_id)
        .first()
    )
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider_id '{instance_in.provider_id}'",
        )

    client_ip = req.client.host if req.client else "127.0.0.1"
    suffix = uuid.uuid4().hex[:8]
    ext_id = (
        f"i-{suffix}"
        if provider.provider_type == "AWS"
        else f"{provider.provider_type.lower()}-vm-{suffix}"
    )
    public_ip = f"{random.randint(11, 199)}.{random.randint(10, 250)}.{random.randint(1, 250)}.{random.randint(2, 250)}"
    private_ip = (
        f"10.{random.randint(0, 10)}.{random.randint(1, 250)}.{random.randint(2, 250)}"
    )

    instance = CloudInstance(
        id=str(uuid.uuid4()),
        external_instance_id=ext_id,
        name=instance_in.name,
        provider_id=instance_in.provider_id,
        region=instance_in.region,
        instance_type=instance_in.instance_type,
        status="RUNNING",
        public_ip=public_ip,
        private_ip=private_ip,
        image_id=instance_in.image_id or "default-cloud-img",
    )
    db.add(instance)

    # Add initial metrics for the provisioned instance
    metric = InstanceMetrics(
        id=str(uuid.uuid4()),
        instance_id=instance.id,
        cpu_utilization_pct=round(random.uniform(10.0, 45.0), 1),
        memory_utilization_pct=round(random.uniform(20.0, 50.0), 1),
        disk_read_bytes_sec=102400.0,
        network_in_bytes_sec=512000.0,
    )
    db.add(metric)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        user_email=current_user.email,
        action="INSTANCE_PROVISIONED",
        target_resource=f"INSTANCE:{instance.id}",
        status="SUCCESS",
        ip_address=client_ip,
        details=f"Provisioned VM {instance.name} ({ext_id}) in {instance.region} on {provider.name}",
    )
    db.add(audit)

    try:
        db.commit()
        db.refresh(instance)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to provision instance: {str(exc)}",
        )

    return instance


@router.post("/{instance_id}/action", response_model=InstanceActionResponse)
def execute_instance_action(
    instance_id: str,
    action_in: InstanceActionRequest,
    req: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Execute lifecycle action on VM instance: START, STOP, RESTART, TERMINATE (Admin only)."""
    instance = db.query(CloudInstance).filter(CloudInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance with id '{instance_id}' not found",
        )

    action = action_in.action.upper().strip()
    valid_actions = ["START", "STOP", "RESTART", "TERMINATE"]
    if action not in valid_actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{action_in.action}'. Must be one of: {', '.join(valid_actions)}",
        )

    previous_status = instance.status
    client_ip = req.client.host if req.client else "127.0.0.1"

    if action == "START":
        instance.status = "RUNNING"
    elif action == "STOP":
        instance.status = "STOPPED"
    elif action == "RESTART":
        instance.status = "RUNNING"
    elif action == "TERMINATE":
        instance.status = "TERMINATED"

    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        user_email=current_user.email,
        action=f"INSTANCE_{action}",
        target_resource=f"INSTANCE:{instance.id}",
        status="SUCCESS",
        ip_address=client_ip,
        details=f"Changed instance status from {previous_status} to {instance.status}",
    )
    db.add(audit)

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute instance action: {str(exc)}",
        )

    return InstanceActionResponse(
        action=action,
        previous_status=previous_status,
        current_status=instance.status,
        message=f"Instance '{instance.name}' transitioned from {previous_status} to {instance.status} via {action} action.",
    )


@router.get("/{instance_id}/metrics", response_model=InstanceMetricsResponse)
def get_instance_metrics(
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the latest telemetry metrics for an instance."""
    instance = db.query(CloudInstance).filter(CloudInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance with id '{instance_id}' not found",
        )

    metrics = (
        db.query(InstanceMetrics)
        .filter(InstanceMetrics.instance_id == instance_id)
        .order_by(InstanceMetrics.timestamp.desc())
        .first()
    )

    if not metrics:
        # Generate default metrics if none exist
        metrics = InstanceMetrics(
            id=str(uuid.uuid4()),
            instance_id=instance_id,
            cpu_utilization_pct=0.0 if instance.status != "RUNNING" else 25.0,
            memory_utilization_pct=0.0 if instance.status != "RUNNING" else 40.0,
            disk_read_bytes_sec=0.0,
            network_in_bytes_sec=0.0,
        )
        db.add(metrics)
        try:
            db.commit()
            db.refresh(metrics)
        except Exception:
            db.rollback()

    return metrics
