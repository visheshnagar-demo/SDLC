import os
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from server.models import Base, User, Tenant, TenantMembership, TenantConfig

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

connect_args = {}
poolclass = None

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    if ":memory:" in DATABASE_URL:
        poolclass = StaticPool

engine_kwargs = {"connect_args": connect_args, "pool_pre_ping": True}
if poolclass:
    engine_kwargs["poolclass"] = poolclass

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_data(db):
    try:
        # 1. Seed Regular Test User
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                full_name="Regular Test User",
                is_active=True,
                is_verified=True,
            )
            db.add(test_user)
            db.flush()

        # 2. Seed Admin Test User
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                full_name="Admin Test User",
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)
            db.flush()

        # 3. Seed Default Tenant (Acme Corp)
        tenant = db.query(Tenant).filter(Tenant.slug == "acme-corp").first()
        if not tenant:
            tenant = Tenant(
                name="Acme Corporation",
                slug="acme-corp",
                domain="acme.com",
                status="Active",
            )
            db.add(tenant)
            db.flush()

        # 4. Seed Config for Tenant
        config = (
            db.query(TenantConfig).filter(TenantConfig.tenant_id == tenant.id).first()
        )
        if not config:
            config = TenantConfig(
                tenant_id=tenant.id,
                rate_limit_rpm=1000,
                storage_quota_gb=50,
                feature_flags={"advanced_analytics": True, "sso_saml_enabled": False},
            )
            db.add(config)

        # 5. Bind Admin to Tenant as Tenant Owner
        admin_membership = (
            db.query(TenantMembership)
            .filter(
                TenantMembership.tenant_id == tenant.id,
                TenantMembership.user_id == admin_user.id,
            )
            .first()
        )
        if not admin_membership:
            admin_membership = TenantMembership(
                tenant_id=tenant.id,
                user_id=admin_user.id,
                role="Tenant Owner",
                status="Active",
            )
            db.add(admin_membership)

        # 6. Bind Test User to Tenant as User
        test_membership = (
            db.query(TenantMembership)
            .filter(
                TenantMembership.tenant_id == tenant.id,
                TenantMembership.user_id == test_user.id,
            )
            .first()
        )
        if not test_membership:
            test_membership = TenantMembership(
                tenant_id=tenant.id,
                user_id=test_user.id,
                role="User",
                status="Active",
            )
            db.add(test_membership)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
