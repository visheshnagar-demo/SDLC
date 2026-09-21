import os
import uuid
import json
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import IntegrityError
import bcrypt

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def init_db():
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    from server.models.api_model import ApiEndpoint
    from server.models.health_log_model import HealthLog

    # Seed sample APIs for monitoring
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    sample_apis = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "Auth Service Health",
            "target_url": "https://httpbin.org/status/200",
            "http_method": "GET",
            "interval_seconds": 60,
            "expected_status": 200,
            "timeout_seconds": 5.0,
            "request_headers": json.dumps({"User-Agent": "HealthMonitor/1.0"}),
            "is_active": True,
            "current_status": "Healthy",
            "last_latency_ms": 125.4,
            "last_checked_at": now,
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "name": "Payments API Gateway",
            "target_url": "https://httpbin.org/status/200",
            "http_method": "POST",
            "interval_seconds": 30,
            "expected_status": 200,
            "timeout_seconds": 5.0,
            "request_headers": json.dumps({"Content-Type": "application/json"}),
            "request_body": json.dumps({"test": True}),
            "is_active": True,
            "current_status": "Healthy",
            "last_latency_ms": 210.8,
            "last_checked_at": now,
        },
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "name": "Legacy Notification Hub",
            "target_url": "https://httpbin.org/status/503",
            "http_method": "GET",
            "interval_seconds": 300,
            "expected_status": 200,
            "timeout_seconds": 3.0,
            "request_headers": None,
            "is_active": True,
            "current_status": "Down",
            "last_latency_ms": 845.2,
            "last_checked_at": now,
        },
    ]

    for api_data in sample_apis:
        try:
            existing = (
                db.query(ApiEndpoint).filter(ApiEndpoint.id == api_data["id"]).first()
            )
            if not existing:
                api = ApiEndpoint(
                    id=api_data["id"],
                    name=api_data["name"],
                    target_url=api_data["target_url"],
                    http_method=api_data["http_method"],
                    interval_seconds=api_data["interval_seconds"],
                    expected_status=api_data["expected_status"],
                    timeout_seconds=api_data["timeout_seconds"],
                    request_headers=api_data["request_headers"],
                    request_body=api_data.get("request_body"),
                    is_active=api_data["is_active"],
                    current_status=api_data["current_status"],
                    last_latency_ms=api_data["last_latency_ms"],
                    last_checked_at=api_data["last_checked_at"],
                )
                db.add(api)
                db.commit()

                # Seed sample logs for each API
                if api_data["current_status"] == "Down":
                    log = HealthLog(
                        id=str(uuid.uuid4()),
                        api_id=api.id,
                        response_status=503,
                        latency_ms=845.2,
                        operational_status="Down",
                        is_success=False,
                        error_message="Expected status 200, got 503",
                        response_body="503 Service Unavailable",
                        checked_at=now,
                    )
                else:
                    log = HealthLog(
                        id=str(uuid.uuid4()),
                        api_id=api.id,
                        response_status=200,
                        latency_ms=api_data["last_latency_ms"],
                        operational_status="Healthy",
                        is_success=True,
                        error_message=None,
                        response_body='{"status": "ok"}',
                        checked_at=now,
                    )
                db.add(log)
                db.commit()
        except IntegrityError:
            db.rollback()
