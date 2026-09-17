from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.models.tenant import Tenant, TenantConfiguration, TenantUser
from server.schemas.tenant import (
    TenantCreate,
    TenantUpdate,
    TenantStatusUpdate,
    TenantConfigUpdate,
    TenantUserCreate,
)
from server.core.security import get_password_hash

TIER_QUOTAS = {
    "Free": {"max_users": 10, "storage_limit_gb": 5, "rate_limit_rpm": 100},
    "Pro": {"max_users": 50, "storage_limit_gb": 100, "rate_limit_rpm": 1000},
    "Enterprise": {"max_users": 500, "storage_limit_gb": 1000, "rate_limit_rpm": 10000},
}


class TenantService:
    @staticmethod
    def create_tenant(db: Session, tenant_in: TenantCreate) -> Tenant:
        # Check duplicate slug
        existing_slug = db.query(Tenant).filter(Tenant.slug == tenant_in.slug).first()
        if existing_slug:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tenant slug '{tenant_in.slug}' already exists",
            )

        tier_defaults = TIER_QUOTAS.get(tenant_in.tier, TIER_QUOTAS["Free"])
        max_users = (
            tenant_in.max_users
            if tenant_in.max_users is not None
            else tier_defaults["max_users"]
        )
        storage_limit_gb = (
            tenant_in.storage_limit_gb
            if tenant_in.storage_limit_gb is not None
            else tier_defaults["storage_limit_gb"]
        )
        rate_limit_rpm = (
            tenant_in.rate_limit_rpm
            if tenant_in.rate_limit_rpm is not None
            else tier_defaults["rate_limit_rpm"]
        )

        tenant = Tenant(
            name=tenant_in.name,
            slug=tenant_in.slug,
            admin_email=tenant_in.admin_email,
            tier=tenant_in.tier,
            status="Active",
            max_users=max_users,
            storage_limit_gb=storage_limit_gb,
            rate_limit_rpm=rate_limit_rpm,
        )
        db.add(tenant)
        db.flush()

        # Create default empty configuration
        config = TenantConfiguration(tenant_id=tenant.id)
        db.add(config)
        db.commit()
        db.refresh(tenant)
        return tenant

    @staticmethod
    def get_tenants(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        tenant_status: Optional[str] = None,
        tier: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Tenant]:
        query = db.query(Tenant)
        if tenant_status:
            query = query.filter(Tenant.status == tenant_status)
        if tier:
            query = query.filter(Tenant.tier == tier)
        if search:
            query = query.filter(
                (Tenant.name.ilike(f"%{search}%")) | (Tenant.slug.ilike(f"%{search}%"))
            )
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_tenant_by_id(db: Session, tenant_id: str) -> Tenant:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant with ID '{tenant_id}' not found",
            )
        return tenant

    @staticmethod
    def update_tenant(db: Session, tenant_id: str, tenant_in: TenantUpdate) -> Tenant:
        tenant = TenantService.get_tenant_by_id(db, tenant_id)
        if tenant.status == "Archived":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Archived tenants cannot be modified",
            )

        update_data = tenant_in.model_dump(exclude_unset=True)
        if "tier" in update_data and update_data["tier"]:
            new_tier = update_data["tier"]
            tier_defaults = TIER_QUOTAS.get(new_tier, {})
            if "max_users" not in update_data:
                update_data["max_users"] = tier_defaults.get(
                    "max_users", tenant.max_users
                )
            if "storage_limit_gb" not in update_data:
                update_data["storage_limit_gb"] = tier_defaults.get(
                    "storage_limit_gb", tenant.storage_limit_gb
                )
            if "rate_limit_rpm" not in update_data:
                update_data["rate_limit_rpm"] = tier_defaults.get(
                    "rate_limit_rpm", tenant.rate_limit_rpm
                )

        for field, value in update_data.items():
            setattr(tenant, field, value)

        db.commit()
        db.refresh(tenant)
        return tenant

    @staticmethod
    def update_tenant_status(
        db: Session, tenant_id: str, status_in: TenantStatusUpdate
    ) -> Tenant:
        tenant = TenantService.get_tenant_by_id(db, tenant_id)
        if tenant.status == "Archived" and status_in.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Archived tenants cannot be modified",
            )

        tenant.status = status_in.status
        db.commit()
        db.refresh(tenant)
        return tenant

    @staticmethod
    def update_tenant_config(
        db: Session, tenant_id: str, config_in: TenantConfigUpdate
    ) -> TenantConfiguration:
        tenant = TenantService.get_tenant_by_id(db, tenant_id)
        if tenant.status == "Archived":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Archived tenants cannot be modified",
            )

        # Check custom domain uniqueness
        if config_in.custom_domain:
            existing_config = (
                db.query(TenantConfiguration)
                .filter(
                    TenantConfiguration.custom_domain == config_in.custom_domain,
                    TenantConfiguration.tenant_id != tenant_id,
                )
                .first()
            )
            if existing_config:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Custom domain '{config_in.custom_domain}' is already in use",
                )

        config = (
            db.query(TenantConfiguration)
            .filter(TenantConfiguration.tenant_id == tenant_id)
            .first()
        )
        if not config:
            config = TenantConfiguration(tenant_id=tenant_id)
            db.add(config)

        update_data = config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)

        db.commit()
        db.refresh(config)
        return config

    @staticmethod
    def delete_tenant(db: Session, tenant_id: str) -> Tenant:
        tenant = TenantService.get_tenant_by_id(db, tenant_id)
        tenant.status = "Archived"
        db.commit()
        db.refresh(tenant)
        return tenant

    @staticmethod
    def create_tenant_user(
        db: Session, tenant_id: str, user_in: TenantUserCreate
    ) -> TenantUser:
        tenant = TenantService.get_tenant_by_id(db, tenant_id)
        if tenant.status in ("Suspended", "Archived"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Tenant is {tenant.status.lower()}. Access blocked.",
            )

        current_user_count = (
            db.query(TenantUser).filter(TenantUser.tenant_id == tenant_id).count()
        )
        if current_user_count >= tenant.max_users:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User seat quota exhausted ({tenant.max_users} max seats allocated)",
            )

        user = TenantUser(
            tenant_id=tenant_id,
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=user_in.role,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_tenant_users(db: Session, tenant_id: str) -> List[TenantUser]:
        tenant = TenantService.get_tenant_by_id(db, tenant_id)
        if tenant.status in ("Suspended", "Archived"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Tenant is {tenant.status.lower()}. Access blocked.",
            )
        return db.query(TenantUser).filter(TenantUser.tenant_id == tenant_id).all()
