import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models import RemoteAction
from server.services.device_service import get_device_by_id
from server.services.audit_service import create_audit_log

ALLOWED_ACTION_TYPES = ["REMOTE_LOCK", "REMOTE_WIPE", "STATUS_CHECK"]


def trigger_remote_action(
    db: Session,
    device_id: str,
    action_type: str,
    reason: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> RemoteAction:
    if action_type not in ALLOWED_ACTION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action type '{action_type}'. Allowed action types: {ALLOWED_ACTION_TYPES}",
        )

    device = get_device_by_id(db, device_id)

    now = datetime.now(timezone.utc)
    remote_action = RemoteAction(
        id=str(uuid.uuid4()),
        device_id=device.id,
        initiated_by_user_id=actor_id or device.id,
        action_type=action_type,
        status="EXECUTED",
        reason=reason,
        executed_at=now,
    )

    if action_type == "REMOTE_WIPE":
        device.status = "WIPED"

    db.add(remote_action)
    db.commit()
    db.refresh(remote_action)
    db.refresh(device)

    create_audit_log(
        db=db,
        actor_id=actor_id,
        action=f"REMOTE_ACTION_{action_type}",
        resource_type="DEVICE",
        resource_id=device.id,
        details={"action_type": action_type, "reason": reason, "status": "EXECUTED"},
    )

    return remote_action


def get_device_actions(db: Session, device_id: str) -> List[RemoteAction]:
    get_device_by_id(db, device_id)
    return (
        db.query(RemoteAction)
        .filter(RemoteAction.device_id == device_id)
        .order_by(RemoteAction.created_at.desc())
        .all()
    )
