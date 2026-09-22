"""Database connection and session management."""

import json
from datetime import datetime, timezone, timedelta
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError

from server.config import settings
from server.models import Base, User, CloudProvider, CloudInstance, InstanceMetric

# Use StaticPool and check_same_thread=False for SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def init_db(engine_to_use=None):
    """Initialize tables in the database."""
    target_engine = engine_to_use or engine
    Base.metadata.create_all(bind=target_engine)


def seed_data(db: Session):
    """Seed initial users, providers, and instances idempotently."""
    try:
        # Seed Admin User
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                full_name="Cloud Administrator",
                role="ADMIN",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        # Seed Regular User
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                full_name="Test Operator",
                role="READ_ONLY",
                is_active=True,
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        # Seed Providers if none exist
        aws_provider = (
            db.query(CloudProvider)
            .filter(CloudProvider.name == "Production AWS")
            .first()
        )
        if not aws_provider:
            aws_provider = CloudProvider(
                name="Production AWS",
                provider_type="AWS",
                encrypted_credentials=json.dumps(
                    {
                        "access_key": "AKIA1234567890EXAMPLE",
                        "secret_key": "encrypted_aws_key_xyz",
                    }
                ),
                is_active=True,
            )
            db.add(aws_provider)
            db.commit()
            db.refresh(aws_provider)

        gcp_provider = (
            db.query(CloudProvider).filter(CloudProvider.name == "Primary GCP").first()
        )
        if not gcp_provider:
            gcp_provider = CloudProvider(
                name="Primary GCP",
                provider_type="GCP",
                encrypted_credentials=json.dumps(
                    {
                        "project_id": "gcp-prod-4892",
                        "client_email": "sa@gcp-prod-4892.iam.gserviceaccount.com",
                    }
                ),
                is_active=True,
            )
            db.add(gcp_provider)
            db.commit()
            db.refresh(gcp_provider)

        azure_provider = (
            db.query(CloudProvider)
            .filter(CloudProvider.name == "Enterprise Azure")
            .first()
        )
        if not azure_provider:
            azure_provider = CloudProvider(
                name="Enterprise Azure",
                provider_type="AZURE",
                encrypted_credentials=json.dumps(
                    {"tenant_id": "tenant-uuid-1234", "client_id": "client-uuid-5678"}
                ),
                is_active=True,
            )
            db.add(azure_provider)
            db.commit()
            db.refresh(azure_provider)

        # Seed Instances if none exist
        if aws_provider:
            inst1 = (
                db.query(CloudInstance)
                .filter(CloudInstance.name == "web-prod-01")
                .first()
            )
            if not inst1:
                inst1 = CloudInstance(
                    provider_id=aws_provider.id,
                    external_instance_id="i-01a2b3c4d5e6f7g8h",
                    name="web-prod-01",
                    region="us-east-1",
                    instance_type="t3.large",
                    status="RUNNING",
                    public_ip="54.210.12.88",
                    private_ip="10.0.1.24",
                )
                db.add(inst1)
                db.commit()
                db.refresh(inst1)

                # Seed sample metrics
                now = datetime.now(timezone.utc)
                for i in range(5):
                    metric = InstanceMetric(
                        instance_id=inst1.id,
                        timestamp=now - timedelta(minutes=i * 5),
                        cpu_utilization_pct=35.5 + (i * 2.1),
                        memory_utilization_pct=58.0 + (i * 1.5),
                        disk_read_bytes_sec=1024 * (i + 1),
                        network_in_bytes_sec=2048 * (i + 1),
                    )
                    db.add(metric)
                db.commit()

        if gcp_provider:
            inst2 = (
                db.query(CloudInstance)
                .filter(CloudInstance.name == "api-server-02")
                .first()
            )
            if not inst2:
                inst2 = CloudInstance(
                    provider_id=gcp_provider.id,
                    external_instance_id="gcp-vm-9982341",
                    name="api-server-02",
                    region="us-central1",
                    instance_type="n2-standard-2",
                    status="RUNNING",
                    public_ip="34.68.210.15",
                    private_ip="10.128.0.5",
                )
                db.add(inst2)
                db.commit()
                db.refresh(inst2)

                now = datetime.now(timezone.utc)
                for i in range(5):
                    metric = InstanceMetric(
                        instance_id=inst2.id,
                        timestamp=now - timedelta(minutes=i * 5),
                        cpu_utilization_pct=42.0 + (i * 1.2),
                        memory_utilization_pct=64.2 - (i * 0.8),
                        disk_read_bytes_sec=4096 * (i + 1),
                        network_in_bytes_sec=8192 * (i + 1),
                    )
                    db.add(metric)
                db.commit()

    except IntegrityError:
        db.rollback()
    except Exception:
        db.rollback()
