from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import SecurityPolicy, User
from server.schemas import PolicyOut, PolicyUpdate, PolicyCreate
from server.auth import get_current_user, require_admin
from server.services.audit_service import log_audit

router = APIRouter(prefix="/api/v1/policies", tags=["Policies"])


@router.get("", response_model=List[PolicyOut])
def get_policies(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(SecurityPolicy).all()


@router.post("", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
def create_policy(
    policy_in: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    policy = SecurityPolicy(**policy_in.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)

    log_audit(
        db=db,
        actor_id=current_user.id,
        action="POLICY_CREATED",
        resource_type="SecurityPolicy",
        resource_id=policy.id,
        details={"name": policy.name},
    )
    return policy


@router.put("/{policy_id}", response_model=PolicyOut)
def update_policy(
    policy_id: str,
    policy_in: PolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    policy = db.query(SecurityPolicy).filter(SecurityPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found"
        )

    update_data = policy_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(policy, field, value)

    db.commit()
    db.refresh(policy)

    log_audit(
        db=db,
        actor_id=current_user.id,
        action="POLICY_UPDATED",
        resource_type="SecurityPolicy",
        resource_id=policy.id,
        details=update_data,
    )
    return policy
