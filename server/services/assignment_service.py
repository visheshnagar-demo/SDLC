import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import User, DeviceAssignment
from server.services.device_service import get_device_by_id
from server.services.audit_service import create_audit_log


def assign_device(
    db: Session,
    device_id: str,
    user_id: str,
    notes: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> DeviceAssignment:
    device = get_device_by_id(db, device_id)
    if device.status not in ["AVAILABLE", "PENDING_RETURN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device '{device.serial_number}' is not available for assignment. Current status: {device.status}",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User '{user.email}' is inactive and cannot be assigned devices.",
        )

    # Close any existing open assignment if present
    active_assignment = (
        db.query(DeviceAssignment)
        .filter(
            DeviceAssignment.device_id == device_id,
            DeviceAssignment.returned_at.is_(None),
        )
        .first()
    )
    if active_assignment:
        active_assignment.returned_at = datetime.now(timezone.utc)

    # Create new assignment
    assignment = DeviceAssignment(
        id=str(uuid.uuid4()),
        device_id=device.id,
        user_id=user.id,
        assigned_at=datetime.now(timezone.utc),
        notes=notes,
    )

    device.status = "ASSIGNED"

    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    db.refresh(device)

    create_audit_log(
        db=db,
        actor_id=actor_id,
        action="ASSIGN_DEVICE",
        resource_type="DEVICE",
        resource_id=device.id,
        details={
            "assigned_to_user_id": user.id,
            "user_email": user.email,
            "notes": notes,
        },
    )

    return assignment


def unassign_device(
    db: Session,
    device_id: str,
    status_after_unassign: str = "AVAILABLE",
    notes: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> DeviceAssignment:
    device = get_device_by_id(db, device_id)

    active_assignment = (
        db.query(DeviceAssignment)
        .filter(
            DeviceAssignment.device_id == device_id,
            DeviceAssignment.returned_at.is_(None),
        )
        .first()
    )

    if not active_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device '{device.serial_number}' has no active assignment to unassign.",
        )

    active_assignment.returned_at = datetime.now(timezone.utc)
    if notes:
        existing_notes = active_assignment.notes or ""
        active_assignment.notes = f"{existing_notes} [Unassigned note: {notes}]".strip()

    valid_statuses = ["AVAILABLE", "PENDING_RETURN", "WIPED", "DECOMMISSIONED"]
    if status_after_unassign not in valid_statuses:
        status_after_unassign = "AVAILABLE"

    device.status = status_after_unassign

    db.commit()
    db.refresh(active_assignment)
    db.refresh(device)

    create_audit_log(
        db=db,
        actor_id=actor_id,
        action="UNASSIGN_DEVICE",
        resource_type="DEVICE",
        resource_id=device.id,
        details={"status_after_unassign": status_after_unassign, "notes": notes},
    )

    return active_assignment


def get_device_assignment_history(
    db: Session, device_id: str
) -> List[DeviceAssignment]:
    # Ensure device exists
    get_device_by_id(db, device_id)
    return (
        db.query(DeviceAssignment)
        .filter(DeviceAssignment.device_id == device_id)
        .order_by(DeviceAssignment.assigned_at.desc())
        .all()
    )
