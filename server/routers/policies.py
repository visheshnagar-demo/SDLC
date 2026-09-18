from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User, SecurityPolicy, Device
from server.schemas import SecurityPolicyResponse, SecurityPolicyUpdate
from server.auth import get_current_admin_user, get_current_support_or_admin_user
from server.services.device_service import evaluate_device_compliance
from server.services.audit_service import create_audit_log

router = APIRouter(prefix="/api/v1/policies", tags=["Security Policies"])


@router.get("", response_model=List[SecurityPolicyResponse])
def list_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_support_or_admin_user),
):
    return db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).all()


@router.put("/{policy_id}", response_model=SecurityPolicyResponse)
def update_policy(
    policy_id: str,
    policy_in: SecurityPolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    policy = db.query(SecurityPolicy).filter(SecurityPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security policy '{policy_id}' not found.",
        )

    update_data = policy_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(policy, field, val)

    db.commit()
    db.refresh(policy)

    # Re-evaluate compliance across all active devices
    active_devices = db.query(Device).filter(Device.status != "DECOMMISSIONED").all()
    for dev in active_devices:
        evaluate_device_compliance(db, dev)
    db.commit()

    create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="SECURITY_POLICY_UPDATED",
        resource_type="SECURITY_POLICY",
        resource_id=policy.id,
        details=update_data,
    )

    return policy
