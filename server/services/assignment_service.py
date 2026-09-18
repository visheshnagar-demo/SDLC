import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import Device, User, DeviceAssignment
from server.schemas import DeviceAssignRequest, DeviceUnassignRequest
from server.services.audit_service import create_audit_log


def assign_device(
    db: Session,
    device_id: str,
    assign_in: DeviceAssignRequest,
    actor_id: Optional[str] = None,
) -> DeviceAssignment:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found.",
        )

    user = db.query(User).filter(User.id == assign_in.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{assign_in.user_id}' not found.",
        )

    if device.status == "ASSIGNED":
        active_assignment = (
            db.query(DeviceAssignment)
            .filter(
                DeviceAssignment.device_id == device_id,
                DeviceAssignment.returned_at == None,
            )
            .first()
        )
        if active_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device is currently assigned. Unassign the device first before re-assigning.",
            )

    if device.status == "DECOMMISSIONED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign a decommissioned device.",
        )

    assignment = DeviceAssignment(
        id=str(uuid.uuid4()),
        device_id=device_id,
        user_id=assign_in.user_id,
        assigned_at=datetime.utcnow(),
        notes=assign_in.notes,
    )

    device.status = "ASSIGNED"

    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    db.refresh(device)

    create_audit_log(
        db=db,
        actor_id=actor_id,
        action="DEVICE_ASSIGNED",
        resource_type="DEVICE_ASSIGNMENT",
        resource_id=assignment.id,
        details={
            "device_id": device_id,
            "user_id": assign_in.user_id,
            "user_email": user.email,
            "notes": assign_in.notes,
        },
    )

    return assignment


def unassign_device(
    db: Session,
    device_id: str,
    unassign_in: DeviceUnassignRequest,
    actor_id: Optional[str] = None,
) -> DeviceAssignment:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found.",
        )

    active_assignment = (
        db.query(DeviceAssignment)
        .filter(
            DeviceAssignment.device_id == device_id,
            DeviceAssignment.returned_at == None,
        )
        .order_by(DeviceAssignment.assigned_at.desc())
        .first()
    )

    if not active_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device is not currently assigned to any user.",
        )

    active_assignment.returned_at = datetime.utcnow()
    if unassign_in.notes:
        existing_notes = active_assignment.notes or ""
        active_assignment.notes = (
            f"{existing_notes} | Unassign note: {unassign_in.notes}".strip(" | ")
        )

    target_status = (
        unassign_in.target_status
        if unassign_in.target_status in ["AVAILABLE", "PENDING_RETURN"]
        else "AVAILABLE"
    )
    device.status = target_status

    db.commit()
    db.refresh(active_assignment)
    db.refresh(device)

    create_audit_log(
        db=db,
        actor_id=actor_id,
        action="DEVICE_UNASSIGNED",
        resource_type="DEVICE_ASSIGNMENT",
        resource_id=active_assignment.id,
        details={
            "device_id": device_id,
            "returned_at": active_assignment.returned_at.isoformat(),
            "target_status": target_status,
        },
    )

    return active_assignment


def get_device_assignments(db: Session, device_id: str) -> List[DeviceAssignment]:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found.",
        )

    return (
        db.query(DeviceAssignment)
        .filter(DeviceAssignment.device_id == device_id)
        .order_by(DeviceAssignment.assigned_at.desc())
        .all()
    )
