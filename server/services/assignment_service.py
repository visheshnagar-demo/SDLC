from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import Device, User, DeviceAssignment
from server.services.audit_service import log_audit


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
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )

    if device.status not in ["Available", "Pending Return"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device cannot be assigned from state '{device.status}'",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Close any existing active assignment for this device
    active_assignment = (
        db.query(DeviceAssignment)
        .filter(
            DeviceAssignment.device_id == device_id,
            DeviceAssignment.returned_at == None,
        )
        .first()
    )

    if active_assignment:
        active_assignment.returned_at = datetime.now(timezone.utc)

    # Create new assignment
    new_assignment = DeviceAssignment(
        device_id=device_id,
        user_id=user_id,
        assigned_at=datetime.now(timezone.utc),
        notes=notes,
    )
    device.status = "Assigned"

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    log_audit(
        db=db,
        actor_id=actor_id,
        action="DEVICE_ASSIGNED",
        resource_type="DeviceAssignment",
        resource_id=new_assignment.id,
        details={
            "device_id": device_id,
            "user_id": user_id,
            "employee_id": user.employee_id,
            "department": user.department,
        },
    )

    return new_assignment


def unassign_device(
    db: Session,
    device_id: str,
    notes: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> Optional[DeviceAssignment]:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
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
            detail="No active assignment found for device",
        )

    active_assignment.returned_at = datetime.now(timezone.utc)
    if notes:
        active_assignment.notes = (
            active_assignment.notes or ""
        ) + f" [Unassigned: {notes}]"

    device.status = "Available"
    db.commit()
    db.refresh(active_assignment)

    log_audit(
        db=db,
        actor_id=actor_id,
        action="DEVICE_UNASSIGNED",
        resource_type="DeviceAssignment",
        resource_id=active_assignment.id,
        details={"device_id": device_id, "user_id": active_assignment.user_id},
    )

    return active_assignment


def get_device_assignments(db: Session, device_id: str) -> List[DeviceAssignment]:
    return (
        db.query(DeviceAssignment)
        .filter(DeviceAssignment.device_id == device_id)
        .order_by(DeviceAssignment.assigned_at.desc())
        .all()
    )
