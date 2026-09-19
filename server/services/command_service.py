from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import Device, RemoteAction, User
from server.schemas import RemoteActionCreate
from server.services.audit_service import log_audit


def trigger_remote_action(
    db: Session, device_id: str, action_in: RemoteActionCreate, actor: User
) -> RemoteAction:
    if actor.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only IT Administrators can issue remote management commands",
        )

    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )

    action_type = action_in.action_type
    if action_type not in ["Remote Lock", "Remote Wipe", "Device Status Check"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action type '{action_type}'",
        )

    # Perform action effect on device status
    if action_type == "Remote Wipe":
        device.status = "Wiped"
    elif action_type == "Remote Lock":
        # Keep status or mark locked
        pass
    elif action_type == "Device Status Check":
        pass

    remote_action = RemoteAction(
        device_id=device_id,
        initiated_by_user_id=actor.id,
        action_type=action_type,
        status="Completed",
        reason=action_in.reason,
        executed_at=datetime.now(timezone.utc),
    )

    db.add(remote_action)
    db.commit()
    db.refresh(remote_action)

    log_audit(
        db=db,
        actor_id=actor.id,
        action=f"REMOTE_ACTION_{action_type.upper().replace(' ', '_')}",
        resource_type="RemoteAction",
        resource_id=remote_action.id,
        details={
            "device_id": device_id,
            "action_type": action_type,
            "reason": action_in.reason,
            "new_device_status": device.status,
        },
    )

    return remote_action
