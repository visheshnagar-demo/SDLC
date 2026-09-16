from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models import SubscriptionTier, Tenant, TenantQuota
from server.schemas import SubscriptionUpdateRequest
from server.services.audit_service import AuditService


class SubscriptionTierService:
    @staticmethod
    def get_all_tiers(db: Session) -> List[SubscriptionTier]:
        return (
            db.query(SubscriptionTier).filter(SubscriptionTier.is_active == True).all()
        )

    @staticmethod
    def get_tier(db: Session, tier_identifier: str) -> Optional[SubscriptionTier]:
        tier = (
            db.query(SubscriptionTier)
            .filter(SubscriptionTier.id == tier_identifier)
            .first()
        )
        if not tier:
            tier = (
                db.query(SubscriptionTier)
                .filter(SubscriptionTier.name == tier_identifier.upper())
                .first()
            )
        return tier

    @staticmethod
    def update_tenant_subscription(
        db: Session, tenant_id: str, update_req: SubscriptionUpdateRequest
    ) -> Tenant:
        tenant = (
            db.query(Tenant)
            .filter((Tenant.id == tenant_id) | (Tenant.tenant_id == tenant_id))
            .first()
        )
        if not tenant or tenant.is_deleted:
            raise HTTPException(status_code=404, detail="Tenant not found")

        target_tier = None
        if update_req.tier_id or update_req.tier_name:
            identifier = update_req.tier_id or update_req.tier_name
            target_tier = SubscriptionTierService.get_tier(db, identifier)
            if not target_tier:
                raise HTTPException(
                    status_code=404,
                    detail=f"Subscription tier '{identifier}' not found",
                )

        current_tier = tenant.tier
        new_tier = target_tier or current_tier

        # Determine effective limits
        quota = tenant.quotas
        new_max_users = (
            update_req.custom_max_users
            if update_req.custom_max_users is not None
            else (
                quota.custom_max_users
                if quota and quota.custom_max_users is not None
                else new_tier.max_users
            )
        )
        new_max_storage = (
            update_req.custom_max_storage_gb
            if update_req.custom_max_storage_gb is not None
            else (
                quota.custom_max_storage_gb
                if quota and quota.custom_max_storage_gb is not None
                else new_tier.max_storage_gb
            )
        )

        # Quota Validation Check for Downgrades
        if tenant.active_users_count > new_max_users:
            raise HTTPException(
                status_code=400,
                detail=f"Downgrade failed: current active users ({tenant.active_users_count}) exceeds target limit ({new_max_users})",
            )

        if tenant.storage_used_gb > new_max_storage:
            raise HTTPException(
                status_code=400,
                detail=f"Downgrade failed: current storage usage ({tenant.storage_used_gb} GB) exceeds target limit ({new_max_storage} GB)",
            )

        if target_tier:
            tenant.tier_id = target_tier.id

        if not quota:
            quota = TenantQuota(tenant_id=tenant.id)
            db.add(quota)

        if update_req.custom_max_users is not None:
            quota.custom_max_users = update_req.custom_max_users
        if update_req.custom_max_storage_gb is not None:
            quota.custom_max_storage_gb = update_req.custom_max_storage_gb
        if update_req.custom_feature_flags is not None:
            quota.custom_feature_flags = update_req.custom_feature_flags

        db.commit()
        db.refresh(tenant)

        AuditService.log_action(
            db=db,
            tenant_id=tenant.id,
            action="TIER_UPDATED",
            details={
                "new_tier": new_tier.name,
                "custom_max_users": update_req.custom_max_users,
                "custom_max_storage_gb": update_req.custom_max_storage_gb,
            },
        )

        return tenant
