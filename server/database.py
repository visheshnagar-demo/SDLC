import sys
import os
import uuid
from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

if __name__ == "server.database":
    sys.modules["database"] = sys.modules["server.database"]
elif __name__ == "database":
    sys.modules["server.database"] = sys.modules["database"]

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/tenant_app.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_data(db: Optional[Session] = None):
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        from server.models import SubscriptionTier, Tenant, TenantDomain, TenantQuota

        tiers_data = [
            {
                "name": "STARTER",
                "display_name": "Starter Tier",
                "max_users": 10,
                "max_storage_gb": 5,
                "feature_flags": {"sso_enabled": False, "custom_domain": False},
            },
            {
                "name": "PRO",
                "display_name": "Pro Tier",
                "max_users": 100,
                "max_storage_gb": 50,
                "feature_flags": {"sso_enabled": True, "custom_domain": True},
            },
            {
                "name": "ENTERPRISE",
                "display_name": "Enterprise Tier",
                "max_users": 1000,
                "max_storage_gb": 500,
                "feature_flags": {
                    "sso_enabled": True,
                    "custom_domain": True,
                    "priority_support": True,
                },
            },
        ]

        for tier in tiers_data:
            existing = (
                db.query(SubscriptionTier)
                .filter(SubscriptionTier.name == tier["name"])
                .first()
            )
            if not existing:
                new_tier = SubscriptionTier(
                    id=str(uuid.uuid4()),
                    name=tier["name"],
                    display_name=tier["display_name"],
                    max_users=tier["max_users"],
                    max_storage_gb=tier["max_storage_gb"],
                    feature_flags=tier["feature_flags"],
                    is_active=True,
                )
                db.add(new_tier)
        db.commit()

        # Seed default tenant id="1"
        existing_tenant = (
            db.query(Tenant)
            .filter(
                (Tenant.id == "1")
                | (Tenant.tenant_id == "1")
                | (Tenant.slug == "demo-corp")
            )
            .first()
        )
        if not existing_tenant:
            starter_tier = (
                db.query(SubscriptionTier)
                .filter(SubscriptionTier.name == "STARTER")
                .first()
            )
            tier_id = starter_tier.id if starter_tier else None
            default_tenant = Tenant(
                id="1",
                tenant_id="1",
                name="Demo Corp",
                slug="demo-corp",
                status="ACTIVE",
                tier_id=tier_id,
                admin_email="admin@democorp.com",
                admin_first_name="Admin",
                admin_last_name="User",
                custom_subdomain="demo-corp.yourplatform.com",
                settings={},
                active_users_count=1,
                storage_used_gb=1,
                is_deleted=False,
            )
            db.add(default_tenant)
            db.flush()

            primary_domain = TenantDomain(
                id=str(uuid.uuid4()),
                tenant_id=default_tenant.id,
                domain_name="demo-corp.yourplatform.com",
                is_primary=True,
                is_verified=True,
            )
            db.add(primary_domain)

            quota = TenantQuota(tenant_id=default_tenant.id)
            db.add(quota)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        if close_session:
            db.close()
