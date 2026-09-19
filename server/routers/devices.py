from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.schemas import (
    DeviceCreate,
    DeviceUpdate,
    DeviceOut,
    DeviceAssignRequest,
    DeviceUnassignRequest,
    AssignmentOut,
    RemoteActionCreate,
    RemoteActionOut,
)
from server.auth import get_current_user, require_admin
from server.services import device_service, assignment_service, command_service

router = APIRouter(prefix="/api/v1/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceOut])
def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    ownership_type: Optional[str] = Query(None),
    os_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_compliant: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    devices, _ = device_service.list_devices(
        db=db,
        skip=skip,
        limit=limit,
        status=status_filter,
        ownership_type=ownership_type,
        os_type=os_type,
        search=search,
        is_compliant=is_compliant,
    )
    return devices


@router.post("", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
def create_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return device_service.create_device(
        db=db, device_in=device_in, actor_id=current_user.id
    )


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = device_service.get_device(db=db, device_id=device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    return device


@router.put("/{device_id}", response_model=DeviceOut)
def update_device(
    device_id: str,
    device_in: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = device_service.update_device(
        db=db, device_id=device_id, device_in=device_in, actor_id=current_user.id
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    return updated


@router.delete("/{device_id}", status_code=status.HTTP_200_OK)
def decommission_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    success = device_service.decommission_device(
        db=db, device_id=device_id, actor_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    return {"detail": "Device successfully decommissioned"}


@router.post("/{device_id}/assign", response_model=AssignmentOut)
def assign_device(
    device_id: str,
    request: DeviceAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return assignment_service.assign_device(
        db=db,
        device_id=device_id,
        user_id=request.user_id,
        notes=request.notes,
        actor_id=current_user.id,
    )


@router.post("/{device_id}/unassign", response_model=AssignmentOut)
def unassign_device(
    device_id: str,
    request: Optional[DeviceUnassignRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes = request.notes if request else None
    return assignment_service.unassign_device(
        db=db, device_id=device_id, notes=notes, actor_id=current_user.id
    )


@router.get("/{device_id}/assignments", response_model=List[AssignmentOut])
def get_device_assignments(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return assignment_service.get_device_assignments(db=db, device_id=device_id)


@router.post("/{device_id}/actions", response_model=RemoteActionOut)
def trigger_remote_action(
    device_id: str,
    action_in: RemoteActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return command_service.trigger_remote_action(
        db=db, device_id=device_id, action_in=action_in, actor=current_user
    )
