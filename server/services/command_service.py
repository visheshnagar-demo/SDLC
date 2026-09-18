import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import Device, RemoteAction
from server.schemas import RemoteActionCreate
from server.services.device_service import evaluate_device_compliance
from server.services.audit_service import create_audit_log


def trigger_remote_action(
    db: Session, device_id: str, action_in: RemoteActionCreate, actor_id: str
) -> RemoteAction:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found.",
        )

    valid_actions = ["REMOTE_LOCK", "REMOTE_WIPE", "STATUS_CHECK"]
    if action_in.action_type not in valid_actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action_type '{action_in.action_type}'. Allowed actions: {valid_actions}",
        )

    remote_action = RemoteAction(
        id=str(uuid.uuid4()),
        device_id=device_id,
        initiated_by_user_id=actor_id,
        action_type=action_in.action_type,
        status="EXECUTED",
        reason=action_in.reason,
        executed_at=datetime.utcnow(),
    )

    # State mutations on device based on command
    if action_in.action_type == "REMOTE_WIPE":
        device.status = "WIPED"
        device.passcode_enforced = True
        device.is_encrypted = True
    elif action_in.action_type == "STATUS_CHECK":
        evaluate_device_compliance(db, device)

    db.add(remote_action)
    db.commit()
    db.refresh(remote_action)
    db.refresh(device)

    create_audit_log(
        db=db,
        actor_id=actor_id,
        action=f"REMOTE_ACTION_{action_in.action_type}",
        resource_type="DEVICE",
        resource_id=device_id,
        details={
            "action_id": remote_action.id,
            "action_type": action_in.action_type,
            "reason": action_in.reason,
            "resulting_device_status": device.status,
        },
    )

    return remote_action
