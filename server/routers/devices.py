from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import (
    DeviceCreate,
    DeviceUpdate,
    DeviceResponse,
    DeviceAssignRequest,
    DeviceUnassignRequest,
    DeviceAssignmentResponse,
    RemoteActionCreate,
    RemoteActionResponse,
)
from server.auth import (
    get_current_user,
    get_current_admin_user,
    get_current_support_or_admin_user,
)
from server.services import device_service, assignment_service, command_service

router = APIRouter(prefix="/api/v1/devices", tags=["Device Inventory"])


@router.get("", response_model=List[DeviceResponse])
def list_devices(
    status_filter: Optional[str] = Query(None, alias="status"),
    os_type: Optional[str] = None,
    ownership_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin_user),
):
    return device_service.list_devices(
        db=db,
        status_filter=status_filter,
        os_type=os_type,
        ownership_type=ownership_type,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return device_service.register_device(
        db=db, device_in=device_in, actor_id=current_user.id
    )


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return device_service.get_device_by_id(db=db, device_id=device_id)


@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: str,
    device_in: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return device_service.update_device(
        db=db, device_id=device_id, device_in=device_in, actor_id=current_user.id
    )


@router.delete("/{device_id}", response_model=DeviceResponse)
def decommission_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return device_service.decommission_device(
        db=db, device_id=device_id, actor_id=current_user.id
    )


@router.post("/{device_id}/assign", response_model=DeviceAssignmentResponse)
def assign_device(
    device_id: str,
    assign_in: DeviceAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin_user),
):
    return assignment_service.assign_device(
        db=db, device_id=device_id, assign_in=assign_in, actor_id=current_user.id
    )


@router.post("/{device_id}/unassign", response_model=DeviceAssignmentResponse)
def unassign_device(
    device_id: str,
    unassign_in: DeviceUnassignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin_user),
):
    return assignment_service.unassign_device(
        db=db, device_id=device_id, unassign_in=unassign_in, actor_id=current_user.id
    )


@router.get("/{device_id}/assignments", response_model=List[DeviceAssignmentResponse])
def get_device_assignments(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin_user),
):
    return assignment_service.get_device_assignments(db=db, device_id=device_id)


@router.post("/{device_id}/actions", response_model=RemoteActionResponse)
def trigger_remote_action(
    device_id: str,
    action_in: RemoteActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return command_service.trigger_remote_action(
        db=db, device_id=device_id, action_in=action_in, actor_id=current_user.id
    )
