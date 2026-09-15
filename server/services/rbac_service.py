from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.models import User, TenantMembership
from server.schemas import TenantUserInvite
from server.database import get_password_hash
from server.services.audit_service import create_audit_log

VALID_ROLES = ["Tenant Owner", "Tenant Admin", "User", "Viewer"]


def list_tenant_users(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[dict], int]:
    query = (
        db.query(TenantMembership, User)
        .join(User, TenantMembership.user_id == User.id)
        .filter(TenantMembership.tenant_id == tenant_id)
    )
    total = query.count()
    results = query.offset(skip).limit(limit).all()

    items = []
    for membership, user in results:
        items.append(
            {
                "id": membership.id,
                "tenant_id": membership.tenant_id,
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": membership.role,
                "status": membership.status,
                "created_at": membership.created_at,
            }
        )

    return items, total


def invite_user_to_tenant(
    db: Session,
    tenant_id: str,
    invite: TenantUserInvite,
    actor_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> dict:
    if invite.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{invite.role}'. Must be one of {VALID_ROLES}.",
        )

    # 1. Get user or create
    user = db.query(User).filter(User.email == invite.email).first()
    if not user:
        user = User(
            email=invite.email,
            full_name=invite.full_name or invite.email.split("@")[0],
            hashed_password=get_password_hash("defaultpass123"),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.flush()

    # 2. Check existing membership
    existing = (
        db.query(TenantMembership)
        .filter(
            TenantMembership.tenant_id == tenant_id, TenantMembership.user_id == user.id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User '{invite.email}' is already a member of this tenant.",
        )

    # 3. Create Membership
    membership = TenantMembership(
        tenant_id=tenant_id,
        user_id=user.id,
        role=invite.role,
        status="Active",
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    # Audit log
    create_audit_log(
        db=db,
        tenant_id=tenant_id,
        action="USER_INVITED",
        entity_type="TenantMembership",
        entity_id=membership.id,
        actor_id=actor_id,
        details={"user_email": user.email, "role": invite.role},
        ip_address=ip_address,
    )

    return {
        "id": membership.id,
        "tenant_id": membership.tenant_id,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": membership.role,
        "status": membership.status,
        "created_at": membership.created_at,
    }


def revoke_user_from_tenant(
    db: Session,
    tenant_id: str,
    user_id: str,
    actor_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> bool:
    membership = (
        db.query(TenantMembership)
        .filter(
            TenantMembership.tenant_id == tenant_id, TenantMembership.user_id == user_id
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User membership for user '{user_id}' not found in tenant '{tenant_id}'.",
        )

    db.delete(membership)
    db.commit()

    # Audit log
    create_audit_log(
        db=db,
        tenant_id=tenant_id,
        action="USER_REVOKED",
        entity_type="TenantMembership",
        entity_id=membership.id,
        actor_id=actor_id,
        details={"user_id": user_id},
        ip_address=ip_address,
    )

    return True
