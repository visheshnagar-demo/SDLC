import uuid
from typing import List, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from server.models import (
    Tenant,
    TenantDomain,
    TenantQuota,
    SubscriptionTier,
    TenantAuditLog,
)
from server.schemas import TenantCreateRequest, TenantUpdateRequest, DomainCreateRequest
from server.services.tier_service import SubscriptionTierService
from server.services.audit_service import AuditService


class TenantService:
    @staticmethod
    def create_tenant(db: Session, req: TenantCreateRequest) -> Tenant:
        # Check duplicate slug or name
        existing_slug = (
            db.query(Tenant)
            .filter((Tenant.slug == req.slug.lower()) | (Tenant.name == req.name))
            .first()
        )
        if existing_slug:
            raise HTTPException(
                status_code=409,
                detail="Duplicate tenant name, slug, or domain registration",
            )

        # Check duplicate subdomain
        subdomain = req.custom_subdomain or f"{req.slug}.yourplatform.com"
        existing_domain = (
            db.query(TenantDomain).filter(TenantDomain.domain_name == subdomain).first()
        )
        if existing_domain:
            raise HTTPException(status_code=409, detail="Duplicate domain registration")

        # Resolve Tier
        tier_identifier = req.tier_id or req.tier_name or "STARTER"
        tier = SubscriptionTierService.get_tier(db, tier_identifier)
        if not tier:
            tier = (
                db.query(SubscriptionTier)
                .filter(SubscriptionTier.name == "STARTER")
                .first()
            )
            if not tier:
                raise HTTPException(
                    status_code=404, detail="Default subscription tier not found"
                )

        tenant_id_str = f"tenant-{req.slug.lower()}-101"

        tenant = Tenant(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id_str,
            name=req.name,
            slug=req.slug.lower(),
            status="ACTIVE",
            tier_id=tier.id,
            admin_email=req.admin_email,
            admin_first_name=req.admin_first_name,
            admin_last_name=req.admin_last_name,
            custom_subdomain=subdomain,
            settings=req.settings or {},
            active_users_count=1,
            storage_used_gb=1,
            is_deleted=False,
        )
        db.add(tenant)
        db.flush()

        # Primary domain
        primary_domain = TenantDomain(
            id=str(uuid.uuid4()),
            tenant_id=tenant.id,
            domain_name=subdomain,
            is_primary=True,
            is_verified=True,
        )
        db.add(primary_domain)

        # Default quota record
        quota = TenantQuota(tenant_id=tenant.id)
        db.add(quota)

        db.commit()
        db.refresh(tenant)

        AuditService.log_action(
            db=db,
            tenant_id=tenant.id,
            action="TENANT_CREATED",
            details={
                "tenant_id": tenant.tenant_id,
                "name": tenant.name,
                "tier": tier.name,
                "admin_email": tenant.admin_email,
                "domain": subdomain,
            },
        )

        return tenant

    @staticmethod
    def get_tenant_by_id(db: Session, identifier: str) -> Tenant:
        tenant = (
            db.query(Tenant)
            .filter(
                (
                    (Tenant.id == identifier)
                    | (Tenant.tenant_id == identifier)
                    | (Tenant.slug == identifier)
                )
                & (Tenant.is_deleted == False)
            )
            .first()
        )
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        return tenant

    @staticmethod
    def list_tenants(
        db: Session, skip: int = 0, limit: int = 20, status: Optional[str] = None
    ) -> Tuple[List[Tenant], int]:
        query = db.query(Tenant).filter(Tenant.is_deleted == False)
        if status:
            query = query.filter(Tenant.status == status.upper())

        total = query.count()
        tenants = (
            query.order_by(Tenant.created_at.desc()).offset(skip).limit(limit).all()
        )
        return tenants, total

    @staticmethod
    def update_tenant(db: Session, identifier: str, req: TenantUpdateRequest) -> Tenant:
        tenant = TenantService.get_tenant_by_id(db, identifier)

        if req.name is not None:
            tenant.name = req.name
        if req.slug is not None:
            existing = (
                db.query(Tenant)
                .filter(Tenant.slug == req.slug.lower(), Tenant.id != tenant.id)
                .first()
            )
            if existing:
                raise HTTPException(status_code=409, detail="Slug already in use")
            tenant.slug = req.slug.lower()
        if req.admin_email is not None:
            tenant.admin_email = req.admin_email
        if req.admin_first_name is not None:
            tenant.admin_first_name = req.admin_first_name
        if req.admin_last_name is not None:
            tenant.admin_last_name = req.admin_last_name
        if req.settings is not None:
            tenant.settings = req.settings

        db.commit()
        db.refresh(tenant)

        AuditService.log_action(
            db=db,
            tenant_id=tenant.id,
            action="TENANT_UPDATED",
            details={"name": tenant.name, "slug": tenant.slug},
        )

        return tenant

    @staticmethod
    def update_tenant_status(db: Session, identifier: str, new_status: str) -> Tenant:
        tenant = TenantService.get_tenant_by_id(db, identifier)
        valid_statuses = ["ACTIVE", "SUSPENDED", "CANCELLED"]
        new_status_upper = new_status.upper()
        if new_status_upper not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of {valid_statuses}",
            )

        old_status = tenant.status
        tenant.status = new_status_upper
        db.commit()
        db.refresh(tenant)

        AuditService.log_action(
            db=db,
            tenant_id=tenant.id,
            action="STATUS_CHANGED",
            details={"old_status": old_status, "new_status": new_status_upper},
        )

        return tenant

    @staticmethod
    def soft_delete_tenant(db: Session, identifier: str):
        tenant = TenantService.get_tenant_by_id(db, identifier)
        tenant.is_deleted = True
        tenant.deleted_at = datetime.now(timezone.utc)
        tenant.status = "SOFT_DELETED"
        db.commit()

        AuditService.log_action(
            db=db,
            tenant_id=tenant.id,
            action="TENANT_DELETED",
            details={"deleted_at": tenant.deleted_at.isoformat()},
        )

    @staticmethod
    def add_tenant_domain(
        db: Session, identifier: str, req: DomainCreateRequest
    ) -> TenantDomain:
        tenant = TenantService.get_tenant_by_id(db, identifier)

        existing = (
            db.query(TenantDomain)
            .filter(TenantDomain.domain_name == req.domain_name)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=409, detail="Domain name already mapped to a tenant"
            )

        if req.is_primary:
            db.query(TenantDomain).filter(TenantDomain.tenant_id == tenant.id).update(
                {"is_primary": False}
            )

        domain = TenantDomain(
            id=str(uuid.uuid4()),
            tenant_id=tenant.id,
            domain_name=req.domain_name,
            is_primary=req.is_primary,
            is_verified=True,
        )
        db.add(domain)
        db.commit()
        db.refresh(domain)

        AuditService.log_action(
            db=db,
            tenant_id=tenant.id,
            action="DOMAIN_ADDED",
            details={
                "domain_name": domain.domain_name,
                "is_primary": domain.is_primary,
            },
        )

        return domain

    @staticmethod
    def list_tenant_domains(db: Session, identifier: str) -> List[TenantDomain]:
        tenant = TenantService.get_tenant_by_id(db, identifier)
        return db.query(TenantDomain).filter(TenantDomain.tenant_id == tenant.id).all()

    @staticmethod
    def delete_tenant_domain(db: Session, identifier: str, domain_id: str):
        tenant = TenantService.get_tenant_by_id(db, identifier)
        domain = (
            db.query(TenantDomain)
            .filter(TenantDomain.id == domain_id, TenantDomain.tenant_id == tenant.id)
            .first()
        )
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")

        domain_name = domain.domain_name
        db.delete(domain)
        db.commit()

        AuditService.log_action(
            db=db,
            tenant_id=tenant.id,
            action="DOMAIN_REMOVED",
            details={"domain_name": domain_name},
        )

    @staticmethod
    def get_tenant_usage(db: Session, identifier: str) -> dict:
        tenant = TenantService.get_tenant_by_id(db, identifier)
        tier = tenant.tier
        quota = tenant.quotas

        max_users = (
            (
                quota.custom_max_users
                if quota and quota.custom_max_users is not None
                else tier.max_users
            )
            if tier
            else 10
        )
        max_storage = (
            (
                quota.custom_max_storage_gb
                if quota and quota.custom_max_storage_gb is not None
                else tier.max_storage_gb
            )
            if tier
            else 5
        )

        active_users = tenant.active_users_count
        storage_used = tenant.storage_used_gb

        pct_users = round((active_users / max_users) * 100, 2) if max_users > 0 else 0.0
        pct_storage = (
            round((storage_used / max_storage) * 100, 2) if max_storage > 0 else 0.0
        )

        return {
            "tenant_id": tenant.tenant_id,
            "active_users": active_users,
            "storage_used_gb": storage_used,
            "max_users": max_users,
            "max_storage_gb": max_storage,
            "usage_percentage_users": pct_users,
            "usage_percentage_storage": pct_storage,
        }

    @staticmethod
    def get_audit_logs(
        db: Session, identifier: str, skip: int = 0, limit: int = 50
    ) -> Tuple[List[TenantAuditLog], int]:
        tenant = TenantService.get_tenant_by_id(db, identifier)
        query = db.query(TenantAuditLog).filter(TenantAuditLog.tenant_id == tenant.id)
        total = query.count()
        logs = (
            query.order_by(TenantAuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return logs, total
