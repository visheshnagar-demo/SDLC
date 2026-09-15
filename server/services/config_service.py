from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.models import TenantConfig, Tenant
from server.schemas import TenantConfigUpdate
from server.services.audit_service import create_audit_log


def get_tenant_config(db: Session, tenant_id: str) -> TenantConfig:
    config = db.query(TenantConfig).filter(TenantConfig.tenant_id == tenant_id).first()
    if not config:
        # Check if tenant exists
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant '{tenant_id}' not found.",
            )
        # Create default config if missing
        config = TenantConfig(
            tenant_id=tenant_id,
            rate_limit_rpm=1000,
            storage_quota_gb=50,
            feature_flags={},
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def update_tenant_config(
    db: Session,
    tenant_id: str,
    update_data: TenantConfigUpdate,
    actor_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> TenantConfig:
    config = get_tenant_config(db, tenant_id)

    changes = {}
    if (
        update_data.rate_limit_rpm is not None
        and update_data.rate_limit_rpm != config.rate_limit_rpm
    ):
        changes["rate_limit_rpm"] = {
            "old": config.rate_limit_rpm,
            "new": update_data.rate_limit_rpm,
        }
        config.rate_limit_rpm = update_data.rate_limit_rpm

    if (
        update_data.storage_quota_gb is not None
        and update_data.storage_quota_gb != config.storage_quota_gb
    ):
        changes["storage_quota_gb"] = {
            "old": config.storage_quota_gb,
            "new": update_data.storage_quota_gb,
        }
        config.storage_quota_gb = update_data.storage_quota_gb

    if update_data.feature_flags is not None:
        changes["feature_flags"] = {
            "old": config.feature_flags,
            "new": update_data.feature_flags,
        }
        config.feature_flags = update_data.feature_flags

    db.commit()
    db.refresh(config)

    # Audit log
    create_audit_log(
        db=db,
        tenant_id=tenant_id,
        action="CONFIG_UPDATE",
        entity_type="TenantConfig",
        entity_id=config.id,
        actor_id=actor_id,
        details={"changes": changes},
        ip_address=ip_address,
    )

    return config
