from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import (
    DeviceRead,
    DeviceCreate,
    DeviceUpdate,
    DeviceAssign,
    DeviceUnassign,
    DeviceAssignmentRead,
    RemoteActionCreate,
    RemoteActionRead,
)
from server.auth import (
    get_current_user,
    get_current_support_or_admin,
    get_current_admin_user,
)
from server.services import device_service, assignment_service, command_service

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceRead])
def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
    os_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin),
):
    return device_service.get_devices(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status,
        os_type=os_type,
        search=search,
    )


@router.post(
    "",
    response_model=DeviceRead,
    status_code=status.HTTP_21_CREATED if hasattr(status, "HTTP_21_CREATED") else 201,
)
def create_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return device_service.create_device(
        db=db, device_in=device_in, actor_id=current_user.id
    )


@router.get("/{id}", response_model=DeviceRead)
def get_device(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return device_service.get_device_by_id(db=db, device_id=id)


@router.put("/{id}", response_model=DeviceRead)
def update_device(
    id: str,
    device_in: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return device_service.update_device(
        db=db, device_id=id, device_in=device_in, actor_id=current_user.id
    )


@router.delete("/{id}", response_model=DeviceRead)
def decommission_device(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return device_service.decommission_device(
        db=db, device_id=id, actor_id=current_user.id
    )


@router.post("/{id}/assign", response_model=DeviceAssignmentRead)
def assign_device(
    id: str,
    assign_in: DeviceAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin),
):
    return assignment_service.assign_device(
        db=db,
        device_id=id,
        user_id=assign_in.user_id,
        notes=assign_in.notes,
        actor_id=current_user.id,
    )


@router.post("/{id}/unassign", response_model=DeviceAssignmentRead)
def unassign_device(
    id: str,
    unassign_in: Optional[DeviceUnassign] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin),
):
    status_after = unassign_in.status_after_unassign if unassign_in else "AVAILABLE"
    notes = unassign_in.notes if unassign_in else None
    return assignment_service.unassign_device(
        db=db,
        device_id=id,
        status_after_unassign=status_after,
        notes=notes,
        actor_id=current_user.id,
    )


@router.get("/{id}/assignments", response_model=List[DeviceAssignmentRead])
def get_device_assignments(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return assignment_service.get_device_assignment_history(db=db, device_id=id)


@router.post("/{id}/actions", response_model=RemoteActionRead)
def trigger_remote_action(
    id: str,
    action_in: RemoteActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return command_service.trigger_remote_action(
        db=db,
        device_id=id,
        action_type=action_in.action_type,
        reason=action_in.reason,
        actor_id=current_user.id,
    )
