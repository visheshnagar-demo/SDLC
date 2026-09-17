import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# For SQLite, check same thread option is required for multi-threading
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables idempotently."""
    # Import all models to ensure they register on Base.metadata
    import server.models.tenant  # noqa: F401

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session) -> None:
    """Seed initial default data idempotently."""
    from server.models.tenant import Tenant, TenantConfiguration, TenantUser
    from server.core.security import get_password_hash

    # Seed System Admin / Default Tenant if not present
    existing_tenant = db.query(Tenant).filter(Tenant.slug == "default").first()
    if not existing_tenant:
        try:
            default_tenant = Tenant(
                id="default-tenant-uuid",
                name="Default System Organization",
                slug="default",
                status="Active",
                tier="Enterprise",
                admin_email="admin@example.com",
                max_users=500,
                storage_limit_gb=1000,
                rate_limit_rpm=10000,
            )
            db.add(default_tenant)
            db.flush()

            default_config = TenantConfiguration(
                id="default-config-uuid",
                tenant_id=default_tenant.id,
                custom_domain="portal.example.com",
                logo_url="https://example.com/logo.png",
                primary_theme_color="#4F46E5",
                saml_sso_config="enabled=false",
            )
            db.add(default_config)

            # Seed Admin User
            admin_user = TenantUser(
                id="admin-user-uuid",
                tenant_id=default_tenant.id,
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                full_name="System Admin",
                role="admin",
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)

            # Seed Regular User
            regular_user = TenantUser(
                id="regular-user-uuid",
                tenant_id=default_tenant.id,
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                full_name="Test User",
                role="user",
                is_active=True,
                is_verified=True,
            )
            db.add(regular_user)

            db.commit()
        except Exception:
            db.rollback()
