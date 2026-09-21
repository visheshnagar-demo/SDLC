import logging
from datetime import datetime, timezone, timedelta
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import IntegrityError
from server.config import DATABASE_URL

logger = logging.getLogger(__name__)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Idempotent database initialization - creates tables if they don't exist."""
    # Ensure all models are registered on Base.metadata
    from server.models.api_model import APIModel  # noqa: F401
    from server.models.health_log_model import HealthLogModel  # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")


def seed_data(db: Session) -> None:
    """Idempotently seed default monitored API endpoints and sample health records."""
    from server.models.api_model import APIModel
    from server.models.health_log_model import HealthLogModel

    existing_count = db.query(APIModel).count()
    if existing_count > 0:
        return

    now = datetime.now(timezone.utc)
    sample_apis = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "name": "Auth Service Health",
            "target_url": "https://httpbin.org/status/200",
            "http_method": "GET",
            "interval_seconds": 30,
            "expected_status": 200,
            "timeout_seconds": 5.0,
            "request_headers": {"Accept": "application/json"},
            "is_active": True,
            "current_status": "Healthy",
            "last_latency_ms": 124.5,
            "last_checked_at": now - timedelta(minutes=1),
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "name": "Payment Gateway API",
            "target_url": "https://httpbin.org/delay/1",
            "http_method": "POST",
            "interval_seconds": 60,
            "expected_status": 200,
            "timeout_seconds": 5.0,
            "request_headers": {"Content-Type": "application/json"},
            "request_body": '{"action": "ping"}',
            "is_active": True,
            "current_status": "Degraded",
            "last_latency_ms": 1150.0,
            "last_checked_at": now - timedelta(minutes=2),
        },
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "name": "Legacy Inventory Microservice",
            "target_url": "https://httpbin.org/status/503",
            "http_method": "GET",
            "interval_seconds": 300,
            "expected_status": 200,
            "timeout_seconds": 5.0,
            "request_headers": {},
            "is_active": True,
            "current_status": "Down",
            "last_latency_ms": 320.0,
            "last_checked_at": now - timedelta(minutes=5),
        },
    ]

    for api_data in sample_apis:
        api_obj = APIModel(**api_data)
        db.add(api_obj)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return

    # Seed sample historical health logs
    sample_logs = [
        # Auth Service logs
        HealthLogModel(
            api_id="11111111-1111-1111-1111-111111111111",
            response_status=200,
            latency_ms=124.5,
            operational_status="Healthy",
            is_success=True,
            checked_at=now - timedelta(minutes=1),
        ),
        HealthLogModel(
            api_id="11111111-1111-1111-1111-111111111111",
            response_status=200,
            latency_ms=132.0,
            operational_status="Healthy",
            is_success=True,
            checked_at=now - timedelta(minutes=10),
        ),
        HealthLogModel(
            api_id="11111111-1111-1111-1111-111111111111",
            response_status=200,
            latency_ms=115.8,
            operational_status="Healthy",
            is_success=True,
            checked_at=now - timedelta(hours=1),
        ),
        # Payment Gateway logs
        HealthLogModel(
            api_id="22222222-2222-2222-2222-222222222222",
            response_status=200,
            latency_ms=1150.0,
            operational_status="Degraded",
            is_success=True,
            error_message="High latency response (exceeded 500ms)",
            checked_at=now - timedelta(minutes=2),
        ),
        HealthLogModel(
            api_id="22222222-2222-2222-2222-222222222222",
            response_status=200,
            latency_ms=350.0,
            operational_status="Healthy",
            is_success=True,
            checked_at=now - timedelta(hours=2),
        ),
        # Legacy Inventory logs (Down/Failure)
        HealthLogModel(
            api_id="33333333-3333-3333-3333-333333333333",
            response_status=503,
            latency_ms=320.0,
            operational_status="Down",
            is_success=False,
            error_message="Received HTTP 503 Service Unavailable (expected 200)",
            response_body="Service Unavailable - Backend cluster overloaded",
            checked_at=now - timedelta(minutes=5),
        ),
        HealthLogModel(
            api_id="33333333-3333-3333-3333-333333333333",
            response_status=500,
            latency_ms=280.0,
            operational_status="Down",
            is_success=False,
            error_message="Internal Server Error: DB connection failed",
            response_body="500 Internal Server Error: Connection pool exhausted",
            checked_at=now - timedelta(hours=3),
        ),
    ]

    for log_obj in sample_logs:
        db.add(log_obj)

    try:
        db.commit()
        logger.info("Sample APIs and historical health logs seeded successfully.")
    except IntegrityError:
        db.rollback()
