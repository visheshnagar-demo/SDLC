"""Database engine and session setup."""

import uuid
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from server.config import DATABASE_URL
from server.models import (
    AuditLog,
    Base,
    CloudInstance,
    CloudProvider,
    InstanceMetrics,
    User,
)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create tables idempotently."""
    Base.metadata.create_all(bind=engine)


def seed_data(db):
    """Seed initial users, providers, and instances idempotently."""
    from server.auth import get_password_hash

    # 1. Seed Users
    seed_users = [
        {"email": "test@example.com", "password": "testpassword", "role": "read_only"},
        {"email": "admin@example.com", "password": "adminpassword", "role": "admin"},
    ]

    for u in seed_users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            new_user = User(
                id=str(uuid.uuid4()),
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"],
                is_active=True,
                is_verified=True,
            )
            db.add(new_user)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()

    # 2. Seed Cloud Providers
    seed_providers = [
        {
            "id": "prov-aws-001",
            "name": "AWS Production Account",
            "provider_type": "AWS",
            "account_id": "123456789012",
            "region": "us-east-1",
            "is_active": True,
        },
        {
            "id": "prov-gcp-001",
            "name": "GCP Cloud Infrastructure",
            "provider_type": "GCP",
            "account_id": "sdlc-prod-2026",
            "region": "us-central1",
            "is_active": True,
        },
        {
            "id": "prov-azure-001",
            "name": "Azure Enterprise Cluster",
            "provider_type": "AZURE",
            "account_id": "sub-az-889021",
            "region": "eastus",
            "is_active": True,
        },
    ]

    for p in seed_providers:
        existing = db.query(CloudProvider).filter(CloudProvider.id == p["id"]).first()
        if not existing:
            provider = CloudProvider(
                id=p["id"],
                name=p["name"],
                provider_type=p["provider_type"],
                account_id=p["account_id"],
                region=p["region"],
                is_active=p["is_active"],
            )
            db.add(provider)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()

    # 3. Seed Cloud Instances
    seed_instances = [
        {
            "id": "inst-web-001",
            "external_instance_id": "i-03ab92fc112",
            "name": "web-server-01",
            "provider_id": "prov-aws-001",
            "region": "us-east-1a",
            "instance_type": "t3.medium",
            "status": "RUNNING",
            "public_ip": "54.210.12.34",
            "private_ip": "10.0.1.15",
            "image_id": "ami-0c55b159cbfafe1f0",
        },
        {
            "id": "inst-db-001",
            "external_instance_id": "inst-db-primary-99",
            "name": "db-primary",
            "provider_id": "prov-gcp-001",
            "region": "us-central1-a",
            "instance_type": "n2-standard-4",
            "status": "RUNNING",
            "public_ip": "34.120.45.67",
            "private_ip": "10.128.0.5",
            "image_id": "debian-11-bullseye",
        },
        {
            "id": "inst-cache-001",
            "external_instance_id": "az-vm-redis-02",
            "name": "cache-cluster-01",
            "provider_id": "prov-azure-001",
            "region": "eastus-2",
            "instance_type": "Standard_D2s_v3",
            "status": "STOPPED",
            "public_ip": "20.84.15.99",
            "private_ip": "10.2.0.4",
            "image_id": "Ubuntu-22_04-LTS",
        },
    ]

    for inst in seed_instances:
        existing = (
            db.query(CloudInstance).filter(CloudInstance.id == inst["id"]).first()
        )
        if not existing:
            instance = CloudInstance(
                id=inst["id"],
                external_instance_id=inst["external_instance_id"],
                name=inst["name"],
                provider_id=inst["provider_id"],
                region=inst["region"],
                instance_type=inst["instance_type"],
                status=inst["status"],
                public_ip=inst["public_ip"],
                private_ip=inst["private_ip"],
                image_id=inst["image_id"],
            )
            db.add(instance)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()

    # 4. Seed Metrics for Instances
    seed_metrics = [
        {
            "instance_id": "inst-web-001",
            "cpu_utilization_pct": 34.5,
            "memory_utilization_pct": 62.1,
            "disk_read_bytes_sec": 1024000.0,
            "network_in_bytes_sec": 4500000.0,
        },
        {
            "instance_id": "inst-db-001",
            "cpu_utilization_pct": 78.2,
            "memory_utilization_pct": 84.6,
            "disk_read_bytes_sec": 8450000.0,
            "network_in_bytes_sec": 12000000.0,
        },
        {
            "instance_id": "inst-cache-001",
            "cpu_utilization_pct": 0.0,
            "memory_utilization_pct": 0.0,
            "disk_read_bytes_sec": 0.0,
            "network_in_bytes_sec": 0.0,
        },
    ]

    for m in seed_metrics:
        existing = (
            db.query(InstanceMetrics)
            .filter(InstanceMetrics.instance_id == m["instance_id"])
            .first()
        )
        if not existing:
            metric = InstanceMetrics(
                id=str(uuid.uuid4()),
                instance_id=m["instance_id"],
                cpu_utilization_pct=m["cpu_utilization_pct"],
                memory_utilization_pct=m["memory_utilization_pct"],
                disk_read_bytes_sec=m["disk_read_bytes_sec"],
                network_in_bytes_sec=m["network_in_bytes_sec"],
            )
            db.add(metric)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()

    # 5. Seed Initial Audit Log
    initial_log = db.query(AuditLog).first()
    if not initial_log:
        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_email="system@cloudpulse.local",
            action="SYSTEM_INITIALIZE",
            target_resource="CORE_SYSTEM",
            status="SUCCESS",
            details="System bootstrap seed data initialized successfully",
            ip_address="127.0.0.1",
        )
        db.add(audit)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
