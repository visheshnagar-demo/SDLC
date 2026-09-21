import os
import uuid
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
    from server.models import (
        User,
        ExchangeRateCache,
        Tank,
        Sensor,
        QualityMetric,
        YieldAnalytic,
        Alert,
    )

    # Seed regular test user
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="user",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed admin user
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                role="admin",
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed ExchangeRateCache if applicable
    try:
        cache = (
            db.query(ExchangeRateCache)
            .filter(ExchangeRateCache.base_currency == "USD")
            .first()
        )
        if not cache:
            now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
            cache = ExchangeRateCache(
                id=str(uuid.uuid4()),
                base_currency="USD",
                rates_json='{"USD": 1.0, "EUR": 0.925, "GBP": 0.79, "JPY": 155.0, "CAD": 1.36}',
                fetched_at=now,
                expires_at=now + datetime.timedelta(minutes=15),
            )
            db.add(cache)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed Rainwater Harvesting Tanks
    try:
        tank_a = db.query(Tank).filter(Tank.name == "Storage Tank A").first()
        if not tank_a:
            now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
            tank_a = Tank(
                id="tank_a1b2c3d4",
                name="Storage Tank A",
                location="North Rooftop Catchment",
                total_capacity_liters=10000.0,
                current_volume_liters=7500.0,
                net_inflow_rate_lpm=120.0,
                net_outflow_rate_lpm=45.0,
                status="ACTIVE",
                supply_pump_active=True,
                overflow_valve_open=False,
                municipal_backup_active=False,
                clean_valve_open=True,
                pump_operating_hours=320.0,
                created_at=now,
                updated_at=now,
            )
            db.add(tank_a)

            tank_b = Tank(
                id="tank_b5c6d7e8",
                name="Storage Tank B",
                location="South Yard Facility",
                total_capacity_liters=25000.0,
                current_volume_liters=21250.0,
                net_inflow_rate_lpm=250.0,
                net_outflow_rate_lpm=80.0,
                status="ACTIVE",
                supply_pump_active=True,
                overflow_valve_open=False,
                municipal_backup_active=False,
                clean_valve_open=True,
                pump_operating_hours=512.0,
                created_at=now,
                updated_at=now,
            )
            db.add(tank_b)

            tank_c = Tank(
                id="tank_c9d0e1f2",
                name="Storage Tank C",
                location="East Lawn Underground",
                total_capacity_liters=15000.0,
                current_volume_liters=1200.0,
                net_inflow_rate_lpm=0.0,
                net_outflow_rate_lpm=0.0,
                status="WARNING",
                supply_pump_active=False,
                overflow_valve_open=False,
                municipal_backup_active=True,
                clean_valve_open=True,
                pump_operating_hours=480.0,
                created_at=now,
                updated_at=now,
            )
            db.add(tank_c)
            db.commit()

            # Seed Sensors
            sensor_1 = Sensor(
                id="sen_tank_a_lvl",
                tank_id="tank_a1b2c3d4",
                sensor_type="level",
                hardware_id="HW-LVL-101",
                is_active=True,
            )
            sensor_2 = Sensor(
                id="sen_tank_a_qual",
                tank_id="tank_a1b2c3d4",
                sensor_type="ph_turbidity",
                hardware_id="HW-QUAL-201",
                is_active=True,
            )
            db.add_all([sensor_1, sensor_2])

            # Seed Quality Metrics
            qm1 = QualityMetric(
                id="qm_001",
                tank_id="tank_a1b2c3d4",
                ph_level=7.2,
                turbidity_ntu=1.4,
                tds_ppm=135.0,
                pass_status=True,
                backwash_scheduled=False,
                timestamp=now,
            )
            qm2 = QualityMetric(
                id="qm_002",
                tank_id="tank_b5c6d7e8",
                ph_level=7.5,
                turbidity_ntu=1.8,
                tds_ppm=142.0,
                pass_status=True,
                backwash_scheduled=False,
                timestamp=now,
            )
            db.add_all([qm1, qm2])

            # Seed Yield Analytic
            ya1 = YieldAnalytic(
                id="yield_001",
                tank_id="tank_a1b2c3d4",
                catchment_area_sqm=500.0,
                precipitation_mm=25.0,
                efficiency_factor=0.9,
                harvested_liters=11250.0,
                recorded_date=now,
            )
            db.add(ya1)

            # Seed Alerts
            alt1 = Alert(
                id="alt_001",
                tank_id="tank_b5c6d7e8",
                severity="MEDIUM",
                category="MAINTENANCE",
                message="Filtration Unit 2 has reached 512 operating hours. Filter cartridge replacement recommended.",
                is_acknowledged=False,
                created_at=now,
            )
            alt2 = Alert(
                id="alt_002",
                tank_id="tank_c9d0e1f2",
                severity="WARNING",
                category="PUMP",
                message="Storage Tank C level dropped below 10% capacity (8% full). Supply pump halted and switched to municipal backup.",
                is_acknowledged=True,
                created_at=now,
            )
            db.add_all([alt1, alt2])

            db.commit()
    except IntegrityError:
        db.rollback()
