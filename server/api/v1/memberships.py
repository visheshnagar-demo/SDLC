import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from server.core.deps import get_current_user, get_db
from server.models.membership import MembershipPlan, UserMembership
from server.models.user import User
from server.schemas.membership import (
    MembershipPlanRead,
    MembershipSubscribeRequest,
    UserMembershipRead,
)

router = APIRouter()


@router.get("/plans", response_model=List[MembershipPlanRead])
def get_membership_plans(db: Session = Depends(get_db)):
    plans = db.query(MembershipPlan).filter(MembershipPlan.is_active == True).all()  # noqa: E712
    return plans


@router.post(
    "/subscribe", response_model=UserMembershipRead, status_code=status.HTTP_201_CREATED
)
def subscribe_membership(
    req: MembershipSubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(MembershipPlan)
        .filter(
            MembershipPlan.id == req.plan_id,
            MembershipPlan.is_active == True,  # noqa: E712
        )
        .first()
    )
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership plan not found or inactive",
        )

    # Deactivate existing active memberships
    existing_memberships = (
        db.query(UserMembership)
        .filter(
            UserMembership.user_id == current_user.id,
            UserMembership.status == "ACTIVE",
        )
        .all()
    )
    for mem in existing_memberships:
        mem.status = "EXPIRED"
        db.add(mem)

    # Set duration based on plan code
    now = datetime.now(timezone.utc)
    if "DAY" in plan.code:
        end_date = now + timedelta(days=1)
    elif "ANNUAL" in plan.code:
        end_date = now + timedelta(days=365)
    else:
        end_date = now + timedelta(days=30)

    new_membership = UserMembership(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        plan_id=plan.id,
        status="ACTIVE",
        start_date=now,
        end_date=end_date,
    )
    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)

    return new_membership


@router.get("/me", response_model=Optional[UserMembershipRead])
def get_my_membership(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = (
        db.query(UserMembership)
        .filter(UserMembership.user_id == current_user.id)
        .order_by(UserMembership.created_at.desc())
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No membership found for current user",
        )
    return membership
