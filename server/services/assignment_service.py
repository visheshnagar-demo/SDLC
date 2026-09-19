import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from server.models import Device, User, DeviceAssignment
from server.services.audit_service import create_audit_log


def assign_device(
    db: Session,
    device_id: str,
    user_id: str,
    notes: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> DeviceAssignment:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' not found.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    # Check active assignment
    active_assignment = (
        db.query(DeviceAssignment)
        .filter(
            DeviceAssignment.device_id == device_id,
            DeviceAssignment.returned_at == None,
        )
        .first()
    )

    if active_assignment:
        # Close existing assignment
        active_assignment.returned_at = datetime.now(timezone.utc)

    # Update device status
    device.status = "Assigned"

    assignment = DeviceAssignment(
        id=str(uuid.uuid4()),
        device_id=device_id,
        user_id=user_id,
        assigned_at=datetime.now(timezone.utc),
        notes=notes,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    create_audit_log(
        db=db,
        action="DEVICE_ASSIGNED",
        resource_type="device",
        resource_id=device_id,
        actor_id=actor_id,
        details={"user_id": user_id, "user_email": user.email, "notes": notes},
    )

    return assignment


def unassign_device(
    db: Session,
    device_id: str,
    notes: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> DeviceAssignment:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' not found.",
        )

    active_assignment = (
        db.query(DeviceAssignment)
        .filter(
            DeviceAssignment.device_id == device_id,
            DeviceAssignment.returned_at == None,
        )
        .first()
    )

    if not active_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device '{device_id}' has no active assignment to unassign.",
        )

    active_assignment.returned_at = datetime.now(timezone.utc)
    if notes:
        active_assignment.notes = (
            active_assignment.notes or ""
        ) + f" [Unassign Note: {notes}]"

    # Transition status
    device.status = "Available"

    db.commit()
    db.refresh(active_assignment)

    create_audit_log(
        db=db,
        action="DEVICE_UNASSIGNED",
        resource_type="device",
        resource_id=device_id,
        actor_id=actor_id,
        details={"user_id": active_assignment.user_id, "notes": notes},
    )

    return active_assignment


def get_device_assignments(db: Session, device_id: str) -> List[DeviceAssignment]:
    return (
        db.query(DeviceAssignment)
        .filter(DeviceAssignment.device_id == device_id)
        .order_by(DeviceAssignment.assigned_at.desc())
        .all()
    )
