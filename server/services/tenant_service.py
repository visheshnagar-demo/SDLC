from typing import Optional, Tuple, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.models import Tenant, User, TenantMembership, TenantConfig
from server.schemas import TenantOnboardRequest, TenantOnboardResponse
from server.database import get_password_hash
from server.services.audit_service import create_audit_log


def onboard_tenant(
    db: Session, data: TenantOnboardRequest, ip_address: Optional[str] = None
) -> TenantOnboardResponse:
    # Check duplicate slug or domain
    existing = (
        db.query(Tenant)
        .filter(
            or_(
                Tenant.slug == data.slug,
                (Tenant.domain != None) & (Tenant.domain == data.domain)
                if data.domain
                else False,
            )
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tenant with this slug or domain already exists.",
        )

    # 1. Create Tenant
    tenant = Tenant(
        name=data.name,
        slug=data.slug,
        domain=data.domain,
        status="Active",
    )
    db.add(tenant)
    db.flush()

    # 2. Get or Create Admin User
    admin_user = db.query(User).filter(User.email == data.admin_email).first()
    if not admin_user:
        admin_user = User(
            email=data.admin_email,
            full_name=data.admin_full_name,
            hashed_password=get_password_hash(data.admin_password),
            is_active=True,
            is_verified=True,
        )
        db.add(admin_user)
        db.flush()

    # 3. Create Tenant Membership
    membership = TenantMembership(
        tenant_id=tenant.id,
        user_id=admin_user.id,
        role="Tenant Owner",
        status="Active",
    )
    db.add(membership)

    # 4. Create Tenant Config
    config = TenantConfig(
        tenant_id=tenant.id,
        rate_limit_rpm=1000,
        storage_quota_gb=50,
        feature_flags={},
    )
    db.add(config)

    db.commit()
    db.refresh(tenant)

    # 5. Audit Log
    create_audit_log(
        db=db,
        tenant_id=tenant.id,
        action="TENANT_ONBOARDED",
        entity_type="Tenant",
        entity_id=tenant.id,
        actor_id=admin_user.id,
        details={
            "name": tenant.name,
            "slug": tenant.slug,
            "admin_email": admin_user.email,
        },
        ip_address=ip_address,
    )

    return TenantOnboardResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        domain=tenant.domain,
        status=tenant.status,
        admin_user_id=admin_user.id,
        created_at=tenant.created_at,
    )


def list_tenants(
    db: Session, skip: int = 0, limit: int = 20, status_filter: Optional[str] = None
) -> Tuple[List[Tenant], int]:
    query = db.query(Tenant)
    if status_filter:
        query = query.filter(Tenant.status == status_filter)
    total = query.count()
    items = query.order_by(Tenant.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_tenant_by_id_or_slug(db: Session, tenant_id: str) -> Tenant:
    tenant = (
        db.query(Tenant)
        .filter(or_(Tenant.id == tenant_id, Tenant.slug == tenant_id))
        .first()
    )
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant '{tenant_id}' not found.",
        )
    return tenant


def update_tenant_status(
    db: Session,
    tenant_id: str,
    new_status: str,
    actor_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Tenant:
    if new_status not in ["Active", "Suspended", "Deactivated"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be Active, Suspended, or Deactivated.",
        )

    tenant = get_tenant_by_id_or_slug(db, tenant_id)
    old_status = tenant.status
    tenant.status = new_status
    db.commit()
    db.refresh(tenant)

    # Audit log
    create_audit_log(
        db=db,
        tenant_id=tenant.id,
        action="TENANT_STATUS_UPDATED",
        entity_type="Tenant",
        entity_id=tenant.id,
        actor_id=actor_id,
        details={"old_status": old_status, "new_status": new_status},
        ip_address=ip_address,
    )

    return tenant
