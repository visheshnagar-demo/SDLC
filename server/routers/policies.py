from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.models import SecurityPolicy, User, Device
from server.schemas import SecurityPolicyResponse, SecurityPolicyUpdate
from server.auth import get_current_admin_user, get_current_user
from server.services.audit_service import create_audit_log
from server.services.device_service import evaluate_compliance

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get("", response_model=List[SecurityPolicyResponse])
def list_policies(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(SecurityPolicy).all()


@router.put("/{id}", response_model=SecurityPolicyResponse)
def update_policy(
    id: str,
    policy_in: SecurityPolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    policy = db.query(SecurityPolicy).filter(SecurityPolicy.id == id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security Policy with ID '{id}' not found.",
        )

    update_data = policy_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(policy, field, value)

    db.commit()
    db.refresh(policy)

    # Re-evaluate all devices compliance
    devices = db.query(Device).all()
    for dev in devices:
        dev.is_compliant = evaluate_compliance(db, dev)
    db.commit()

    create_audit_log(
        db=db,
        action="POLICY_UPDATED",
        resource_type="policy",
        resource_id=id,
        actor_id=current_user.id,
        details=update_data,
    )

    return policy
