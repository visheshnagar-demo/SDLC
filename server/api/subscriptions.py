from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import TierResponse, SubscriptionUpdateRequest, SubscriptionResponse
from server.services.tier_service import SubscriptionTierService

router = APIRouter(prefix="/api/v1", tags=["subscriptions"])


@router.get("/subscription-tiers", response_model=List[TierResponse])
def list_subscription_tiers(db: Session = Depends(get_db)):
    tiers = SubscriptionTierService.get_all_tiers(db)
    return [TierResponse.model_validate(t) for t in tiers]


@router.put("/tenants/{id}/subscription", response_model=SubscriptionResponse)
def update_tenant_subscription(
    id: str, req: SubscriptionUpdateRequest, db: Session = Depends(get_db)
):
    tenant = SubscriptionTierService.update_tenant_subscription(db, id, req)
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
    feature_flags = (
        (
            quota.custom_feature_flags
            if quota and quota.custom_feature_flags
            else tier.feature_flags
        )
        if tier
        else {}
    )

    return SubscriptionResponse(
        tenant_id=tenant.tenant_id,
        tier_id=tenant.tier_id,
        tier_name=tier.name if tier else "STARTER",
        max_users=max_users,
        max_storage_gb=max_storage,
        feature_flags=feature_flags or {},
        custom_max_users=quota.custom_max_users if quota else None,
        custom_max_storage_gb=quota.custom_max_storage_gb if quota else None,
    )
