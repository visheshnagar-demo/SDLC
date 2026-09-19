from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import User
from server.schemas import (
    DeviceResponse,
    DeviceCreate,
    DeviceUpdate,
    DeviceAssignRequest,
    DeviceUnassignRequest,
    DeviceAssignmentResponse,
    RemoteActionCreate,
    RemoteActionResponse,
)
from server.auth import get_current_user, get_current_admin_user
from server.services import device_service, assignment_service, command_service

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceResponse])
def list_devices(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = Query(None, alias="status"),
    ownership_type: Optional[str] = None,
    os_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return device_service.get_devices(
        db,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        ownership_type=ownership_type,
        os_type=os_type,
        search=search,
    )


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return device_service.create_device(db, device_in, actor_id=current_user.id)


@router.get("/{id}", response_model=DeviceResponse)
def get_device(id: str, db: Session = Depends(get_db)):
    device = device_service.get_device_by_id(db, id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{id}' not found.",
        )
    return device


@router.put("/{id}", response_model=DeviceResponse)
def update_device(
    id: str,
    device_in: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return device_service.update_device(db, id, device_in, actor_id=current_user.id)


@router.delete("/{id}", response_model=DeviceResponse)
def delete_device(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return device_service.delete_device(db, id, actor_id=current_user.id)


@router.post("/{id}/assign", response_model=DeviceAssignmentResponse)
def assign_device(
    id: str,
    assign_in: DeviceAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return assignment_service.assign_device(
        db,
        device_id=id,
        user_id=assign_in.user_id,
        notes=assign_in.notes,
        actor_id=current_user.id,
    )


@router.post("/{id}/unassign", response_model=DeviceAssignmentResponse)
def unassign_device(
    id: str,
    unassign_in: Optional[DeviceUnassignRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    notes = unassign_in.notes if unassign_in else None
    return assignment_service.unassign_device(
        db, device_id=id, notes=notes, actor_id=current_user.id
    )


@router.get("/{id}/assignments", response_model=List[DeviceAssignmentResponse])
def get_assignment_history(id: str, db: Session = Depends(get_db)):
    return assignment_service.get_device_assignments(db, id)


@router.post("/{id}/actions", response_model=RemoteActionResponse)
def trigger_action(
    id: str,
    action_in: RemoteActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    return command_service.trigger_remote_action(
        db,
        device_id=id,
        action_type=action_in.action_type,
        reason=action_in.reason,
        actor_id=current_user.id,
    )
