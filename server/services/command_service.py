import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from server.models import Device, RemoteAction
from server.services.audit_service import create_audit_log


def trigger_remote_action(
    db: Session,
    device_id: str,
    action_type: str,
    reason: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> RemoteAction:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' not found.",
        )

    valid_actions = ["Remote Lock", "Remote Wipe", "Status Check"]
    if action_type not in valid_actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action type '{action_type}'. Valid actions: {valid_actions}",
        )

    # Perform action status updates
    if action_type == "Remote Wipe":
        device.status = "Wiped"
        device.is_encrypted = True
    elif action_type == "Remote Lock":
        device.passcode_enforced = True

    action_record = RemoteAction(
        id=str(uuid.uuid4()),
        device_id=device_id,
        initiated_by_user_id=actor_id,
        action_type=action_type,
        status="Completed",
        reason=reason,
        executed_at=datetime.now(timezone.utc),
    )

    db.add(action_record)
    db.commit()
    db.refresh(action_record)

    create_audit_log(
        db=db,
        action=f"REMOTE_ACTION_{action_type.upper().replace(' ', '_')}",
        resource_type="device",
        resource_id=device_id,
        actor_id=actor_id,
        details={"action_type": action_type, "reason": reason, "status": "Completed"},
    )

    return action_record
