import os
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/aquarium.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

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
    from server import models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    from server import models

    # Check if already seeded
    existing_tank = db.query(models.Tank).first()
    if existing_tank:
        return

    now = datetime.now(timezone.utc)

    # 1. Seed Tanks
    tank_1 = models.Tank(
        id=str(uuid.uuid4()),
        name="Tank 1 - Coral Reef Biosphere",
        location="Marine Pavilion - Zone A",
        capacity_liters=1500.0,
        water_type="Saltwater",
        created_at=now,
        updated_at=now,
    )
    tank_2 = models.Tank(
        id=str(uuid.uuid4()),
        name="Tank 2 - Amazon Basin River",
        location="Freshwater Hall - Zone B",
        capacity_liters=850.0,
        water_type="Freshwater",
        created_at=now,
        updated_at=now,
    )
    db.add_all([tank_1, tank_2])
    db.commit()
    db.refresh(tank_1)
    db.refresh(tank_2)

    # 2. Seed Thresholds for Tank 1
    t1_thresholds = [
        models.AlertThreshold(
            id=str(uuid.uuid4()),
            tank_id=tank_1.id,
            parameter_name="ph_level",
            min_threshold=8.1,
            max_threshold=8.4,
            is_active=True,
            created_at=now,
            updated_at=now,
        ),
        models.AlertThreshold(
            id=str(uuid.uuid4()),
            tank_id=tank_1.id,
            parameter_name="dissolved_oxygen",
            min_threshold=6.5,
            max_threshold=8.5,
            is_active=True,
            created_at=now,
            updated_at=now,
        ),
        models.AlertThreshold(
            id=str(uuid.uuid4()),
            tank_id=tank_1.id,
            parameter_name="temperature_c",
            min_threshold=24.5,
            max_threshold=26.5,
            is_active=True,
            created_at=now,
            updated_at=now,
        ),
        models.AlertThreshold(
            id=str(uuid.uuid4()),
            tank_id=tank_1.id,
            parameter_name="ammonia_ppm",
            min_threshold=0.0,
            max_threshold=0.02,
            is_active=True,
            created_at=now,
            updated_at=now,
        ),
    ]

    # Thresholds for Tank 2
    t2_thresholds = [
        models.AlertThreshold(
            id=str(uuid.uuid4()),
            tank_id=tank_2.id,
            parameter_name="ph_level",
            min_threshold=6.5,
            max_threshold=7.5,
            is_active=True,
            created_at=now,
            updated_at=now,
        ),
        models.AlertThreshold(
            id=str(uuid.uuid4()),
            tank_id=tank_2.id,
            parameter_name="dissolved_oxygen",
            min_threshold=6.0,
            max_threshold=9.0,
            is_active=True,
            created_at=now,
            updated_at=now,
        ),
        models.AlertThreshold(
            id=str(uuid.uuid4()),
            tank_id=tank_2.id,
            parameter_name="temperature_c",
            min_threshold=24.0,
            max_threshold=28.0,
            is_active=True,
            created_at=now,
            updated_at=now,
        ),
        models.AlertThreshold(
            id=str(uuid.uuid4()),
            tank_id=tank_2.id,
            parameter_name="ammonia_ppm",
            min_threshold=0.0,
            max_threshold=0.05,
            is_active=True,
            created_at=now,
            updated_at=now,
        ),
    ]
    db.add_all(t1_thresholds + t2_thresholds)

    # 3. Seed Telemetry
    telemetry_1 = models.TelemetryReading(
        id=str(uuid.uuid4()),
        tank_id=tank_1.id,
        ph_level=8.25,
        dissolved_oxygen=7.1,
        temperature_c=25.4,
        ammonia_ppm=0.01,
        recorded_at=now - timedelta(minutes=5),
        created_at=now - timedelta(minutes=5),
    )
    telemetry_2 = models.TelemetryReading(
        id=str(uuid.uuid4()),
        tank_id=tank_2.id,
        ph_level=6.9,
        dissolved_oxygen=6.8,
        temperature_c=26.0,
        ammonia_ppm=0.02,
        recorded_at=now - timedelta(minutes=3),
        created_at=now - timedelta(minutes=3),
    )
    db.add_all([telemetry_1, telemetry_2])

    # 4. Seed Feeding Schedules
    sched_1 = models.FeedingSchedule(
        id=str(uuid.uuid4()),
        tank_id=tank_1.id,
        food_type="Marine Micro-Pellets & Spirulina",
        portion_grams=25.0,
        frequency="Twice Daily",
        scheduled_time="08:30",
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    sched_2 = models.FeedingSchedule(
        id=str(uuid.uuid4()),
        tank_id=tank_2.id,
        food_type="Bloodworms & Tropical Flakes",
        portion_grams=15.0,
        frequency="Daily",
        scheduled_time="09:00",
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add_all([sched_1, sched_2])
    db.commit()
    db.refresh(sched_1)

    # 5. Seed Feeding Log
    f_log = models.FeedingLog(
        id=str(uuid.uuid4()),
        tank_id=tank_1.id,
        schedule_id=sched_1.id,
        food_type=sched_1.food_type,
        portion_grams=sched_1.portion_grams,
        fed_by="Elena Rostova",
        fed_at=now - timedelta(hours=2),
        notes="All specimens fed actively. No uneaten food remaining.",
        created_at=now - timedelta(hours=2),
    )
    db.add(f_log)

    # 6. Seed Fish Health Records
    health_1 = models.FishHealthRecord(
        id=str(uuid.uuid4()),
        tank_id=tank_1.id,
        species="Amphiprion ocellaris (Clownfish)",
        population_count=12,
        health_status="Healthy",
        symptoms="None observed; vibrant pigmentation and active swimming.",
        treatment_notes="Routine vitamin enrichment added to diet.",
        is_quarantined=False,
        recorded_by="Elena Rostova",
        recorded_at=now - timedelta(days=1),
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(days=1),
    )
    health_2 = models.FishHealthRecord(
        id=str(uuid.uuid4()),
        tank_id=tank_2.id,
        species="Paracheirodon innesi (Neon Tetra)",
        population_count=45,
        health_status="Healthy",
        symptoms="None observed.",
        treatment_notes="Water conditioner preventative treatment.",
        is_quarantined=False,
        recorded_by="Marcus Vance",
        recorded_at=now - timedelta(days=2),
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(days=2),
    )
    db.add_all([health_1, health_2])

    # 7. Seed Equipment
    eq_1 = models.Equipment(
        id=str(uuid.uuid4()),
        tank_id=tank_1.id,
        name="Reef Canister Bio-Filter Pro 5000",
        equipment_type="Filter",
        model_number="CF-PRO-5000",
        maintenance_interval_days=30,
        last_serviced_at=now - timedelta(days=25),
        next_due_at=now + timedelta(days=5),
        status="OPERATIONAL",
        created_at=now - timedelta(days=25),
        updated_at=now - timedelta(days=25),
    )
    eq_2 = models.Equipment(
        id=str(uuid.uuid4()),
        tank_id=tank_2.id,
        name="FreshFlow Return Pump 3000L/h",
        equipment_type="Pump",
        model_number="FF-PUMP-3000",
        maintenance_interval_days=60,
        last_serviced_at=now - timedelta(days=65),
        next_due_at=now - timedelta(days=5),
        status="OVERDUE",
        created_at=now - timedelta(days=65),
        updated_at=now - timedelta(days=65),
    )
    db.add_all([eq_1, eq_2])

    # 8. Seed Alert for Overdue or Test parameter
    alert_1 = models.Alert(
        id=str(uuid.uuid4()),
        tank_id=tank_2.id,
        parameter_name="ammonia_ppm",
        recorded_value=0.06,
        threshold_violated="MAX",
        severity="WARNING",
        status="ACTIVE",
        message="ammonia_ppm breached MAX threshold (0.06 outside [0.0, 0.05])",
        triggered_at=now - timedelta(hours=1),
        acknowledged_at=None,
        resolved_at=None,
        created_at=now - timedelta(hours=1),
        updated_at=now - timedelta(hours=1),
    )
    db.add(alert_1)

    db.commit()
