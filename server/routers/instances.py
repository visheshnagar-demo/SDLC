"""Cloud VM Instance Lifecycle Management Router."""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import CloudInstance, CloudProvider, InstanceMetric, AuditLog, User
from server.schemas import (
    CloudInstanceCreate,
    CloudInstanceOut,
    CloudInstanceActionRequest,
    CloudInstanceActionResponse,
)
from server.security import get_current_user, require_role
from server.services.cloud_adapter import CloudProviderAdapter

router = APIRouter(prefix="/instances", tags=["Instances"])


@router.get("", response_model=List[CloudInstanceOut])
def list_instances(
    provider: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List VM instances with optional provider, status filters and pagination."""
    query = db.query(CloudInstance)

    if provider:
        # Check if provider is UUID or name/type
        prov = (
            db.query(CloudProvider)
            .filter(
                (CloudProvider.id == provider)
                | (CloudProvider.provider_type == provider.upper())
                | (CloudProvider.name == provider)
            )
            .first()
        )
        if prov:
            query = query.filter(CloudInstance.provider_id == prov.id)

    if status:
        query = query.filter(CloudInstance.status == status.upper())

    instances = query.offset(skip).limit(limit).all()
    return instances


@router.get("/{instance_id}", response_model=CloudInstanceOut)
def get_instance(
    instance_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single VM instance."""
    instance = db.query(CloudInstance).filter(CloudInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance with ID {instance_id} not found",
        )
    return instance


@router.post("", status_code=status.HTTP_201_CREATED)
def provision_instance(
    request: Request,
    instance_in: CloudInstanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Provision a new cloud virtual machine instance (Admin only)."""
    provider = (
        db.query(CloudProvider)
        .filter(CloudProvider.id == instance_in.provider_id)
        .first()
    )
    if not provider:
        # Also try matching provider by name or type
        provider = (
            db.query(CloudProvider)
            .filter(
                (CloudProvider.provider_type == instance_in.provider_id.upper())
                | (CloudProvider.name == instance_in.provider_id)
            )
            .first()
        )

    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cloud provider with ID {instance_in.provider_id} not found",
        )

    external_id, public_ip, private_ip = CloudProviderAdapter.provision_vm(
        provider.provider_type,
        instance_in.name,
        instance_in.region,
        instance_in.instance_type,
    )

    new_instance = CloudInstance(
        provider_id=provider.id,
        external_instance_id=external_id,
        name=instance_in.name,
        region=instance_in.region,
        instance_type=instance_in.instance_type,
        status="PROVISIONING",
        public_ip=public_ip,
        private_ip=private_ip,
        launch_time=datetime.now(timezone.utc),
    )
    db.add(new_instance)
    db.commit()
    db.refresh(new_instance)

    # Generate initial telemetry metric
    initial_metric = InstanceMetric(
        instance_id=new_instance.id,
        timestamp=datetime.now(timezone.utc),
        cpu_utilization_pct=10.0,
        memory_utilization_pct=25.0,
        disk_read_bytes_sec=1024,
        network_in_bytes_sec=512,
    )
    db.add(initial_metric)

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="INSTANCE_PROVISION",
        target_resource=f"INSTANCE:{new_instance.id}",
        status="SUCCESS",
        details=f"Provisioned {new_instance.name} on {provider.provider_type} ({new_instance.region})",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()

    return {
        "instance_id": new_instance.id,
        "id": new_instance.id,
        "name": new_instance.name,
        "status": new_instance.status,
        "provider_id": new_instance.provider_id,
        "external_instance_id": new_instance.external_instance_id,
        "region": new_instance.region,
        "instance_type": new_instance.instance_type,
        "public_ip": new_instance.public_ip,
        "private_ip": new_instance.private_ip,
        "message": "Instance provisioning initiated",
    }


@router.post("/{instance_id}/action", response_model=CloudInstanceActionResponse)
def execute_instance_action(
    instance_id: str,
    action_in: CloudInstanceActionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Execute lifecycle action on VM instance: START, STOP, RESTART, TERMINATE (Admin only)."""
    instance = db.query(CloudInstance).filter(CloudInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instance with ID {instance_id} not found",
        )

    valid_actions = ["START", "STOP", "RESTART", "TERMINATE"]
    action_upper = action_in.action.upper()
    if action_upper not in valid_actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{action_in.action}'. Must be one of {valid_actions}",
        )

    previous_status = instance.status
    new_status, msg = CloudProviderAdapter.execute_action(action_upper, previous_status)

    instance.status = new_status
    db.commit()
    db.refresh(instance)

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action=f"INSTANCE_{action_upper}",
        target_resource=f"INSTANCE:{instance.id}",
        status="SUCCESS",
        details=f"Action {action_upper} triggered. Status: {previous_status} -> {new_status}",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()

    return CloudInstanceActionResponse(
        instance_id=instance.id,
        action=action_upper,
        previous_status=previous_status,
        current_status=instance.status,
        message=msg,
    )
