import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User, SecurityPolicy, Device
from server.schemas import (
    SecurityPolicyRead,
    SecurityPolicyCreate,
    SecurityPolicyUpdate,
)
from server.auth import get_current_user, get_current_admin_user
from server.services.device_service import check_device_compliance
from server.services.audit_service import create_audit_log

router = APIRouter(prefix="/policies", tags=["Security Policies"])


@router.get("", response_model=List[SecurityPolicyRead])
def get_policies(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(SecurityPolicy).all()


@router.post("", response_model=SecurityPolicyRead, status_code=201)
def create_policy(
    policy_in: SecurityPolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    policy = SecurityPolicy(
        id=str(uuid.uuid4()),
        name=policy_in.name,
        description=policy_in.description,
        min_os_version_ios=policy_in.min_os_version_ios,
        min_os_version_android=policy_in.min_os_version_android,
        require_encryption=policy_in.require_encryption,
        require_passcode=policy_in.require_passcode,
        is_active=policy_in.is_active,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)

    # Re-evaluate all devices for compliance
    all_devices = db.query(Device).all()
    for dev in all_devices:
        dev.is_compliant = check_device_compliance(dev, db)
    db.commit()

    create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="CREATE_SECURITY_POLICY",
        resource_type="SECURITY_POLICY",
        resource_id=policy.id,
        details={"name": policy.name},
    )

    return policy


@router.put("/{id}", response_model=SecurityPolicyRead)
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
    for field, val in update_data.items():
        setattr(policy, field, val)

    db.commit()
    db.refresh(policy)

    # Re-evaluate device compliance across fleet
    all_devices = db.query(Device).all()
    for dev in all_devices:
        dev.is_compliant = check_device_compliance(dev, db)
    db.commit()

    create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="UPDATE_SECURITY_POLICY",
        resource_type="SECURITY_POLICY",
        resource_id=policy.id,
        details=update_data,
    )

    return policy
