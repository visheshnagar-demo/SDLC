import os
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from server.models import (
    Base,
    Cattle,
    MilkLog,
    BreedingRecord,
    FeedRation,
    FeedInventory,
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/farm_app.db")

# For SQLite, check_same_thread=False is needed
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_data(db: Session):
    """Seed initial demo data idempotently."""
    try:
        # Check if already seeded
        existing_cow = db.query(Cattle).filter(Cattle.tag_number == "COW-1042").first()
        if not existing_cow:
            # Seed Dam & Sire
            dam = Cattle(
                id="c0000000-0000-0000-0000-000000000001",
                tag_number="COW-0512",
                rfid_tag="982 000005120001",
                breed="Holstein-Friesian",
                gender="Female",
                date_of_birth=date(2019, 4, 10),
                status="Active",
                body_condition_score=3.2,
                weight_kg=620.0,
            )
            sire = Cattle(
                id="c0000000-0000-0000-0000-000000000002",
                tag_number="BULL-0089",
                rfid_tag="982 000000890002",
                breed="Holstein-Friesian",
                gender="Male",
                date_of_birth=date(2018, 2, 20),
                status="Active",
                body_condition_score=3.5,
                weight_kg=850.0,
            )
            db.add(dam)
            db.add(sire)
            db.flush()

            # Seed Primary Cow COW-1042
            cow1 = Cattle(
                id="c0000000-0000-0000-0000-000000001042",
                tag_number="COW-1042",
                rfid_tag="982 000010428912",
                breed="Holstein-Friesian",
                gender="Female",
                date_of_birth=date(2022, 3, 15),
                dam_id=dam.id,
                sire_id=sire.id,
                status="Lactating",
                body_condition_score=3.25,
                weight_kg=610.0,
            )
            cow2 = Cattle(
                id="c0000000-0000-0000-0000-000000001043",
                tag_number="COW-1043",
                rfid_tag="982 000010438913",
                breed="Jersey",
                gender="Female",
                date_of_birth=date(2021, 8, 22),
                status="Lactating",
                body_condition_score=3.0,
                weight_kg=450.0,
            )
            cow3 = Cattle(
                id="c0000000-0000-0000-0000-000000001044",
                tag_number="COW-1044",
                rfid_tag="982 000010448914",
                breed="Brown Swiss",
                gender="Female",
                date_of_birth=date(2023, 1, 10),
                status="Pregnant",
                body_condition_score=3.5,
                weight_kg=580.0,
            )
            db.add(cow1)
            db.add(cow2)
            db.add(cow3)
            db.flush()

            # Seed Milk Logs for COW-1042 (last 7 days to establish baseline average around 20L)
            today = date.today()
            for i in range(7, 0, -1):
                log_day = today - timedelta(days=i)
                ml_m = MilkLog(
                    cow_id=cow1.id,
                    milking_date=log_day,
                    session="Morning",
                    yield_liters=10.5,
                    fat_percentage=3.8,
                    protein_percentage=3.2,
                    somatic_cell_count=145000,
                    is_withheld=False,
                    variance_alert=False,
                )
                ml_e = MilkLog(
                    cow_id=cow1.id,
                    milking_date=log_day,
                    session="Evening",
                    yield_liters=9.5,
                    fat_percentage=3.9,
                    protein_percentage=3.3,
                    somatic_cell_count=150000,
                    is_withheld=False,
                    variance_alert=False,
                )
                db.add(ml_m)
                db.add(ml_e)

            # Seed Breeding Record
            breeding = BreedingRecord(
                cow_id=cow3.id,
                stage="Confirmed Pregnant",
                event_date=today - timedelta(days=60),
                insemination_date=today - timedelta(days=60),
                sire_rfid_or_code="982 000000890002",
                gestation_check_due_date=today - timedelta(days=16),
                expected_calving_date=today + timedelta(days=223),
                notes="Confirmed pregnant via ultrasound.",
            )
            db.add(breeding)

            # Seed Feed Rations
            ration1 = FeedRation(
                ration_name="High-Yield Lactation TMR",
                target_group="High Yield",
                dry_matter_kg_per_day=22.0,
                silage_pct=60.0,
                concentrate_pct=25.0,
                forage_supplements_pct=15.0,
            )
            ration2 = FeedRation(
                ration_name="Standard Lactation TMR",
                target_group="Mid Yield",
                dry_matter_kg_per_day=18.0,
                silage_pct=65.0,
                concentrate_pct=20.0,
                forage_supplements_pct=15.0,
            )
            ration3 = FeedRation(
                ration_name="Dry Cow & Gestation Ration",
                target_group="Dry Cows",
                dry_matter_kg_per_day=14.0,
                silage_pct=75.0,
                concentrate_pct=10.0,
                forage_supplements_pct=15.0,
            )
            db.add(ration1)
            db.add(ration2)
            db.add(ration3)

            # Seed Feed Inventory
            inv1 = FeedInventory(
                feed_name="Corn Silage",
                category="Forage",
                current_stock_kg=12500.0,
                daily_consumption_kg=650.0,
                reorder_threshold_kg=3250.0,
                reorder_alert=False,
            )
            inv2 = FeedInventory(
                feed_name="Soybean Meal Concentrate",
                category="Concentrate",
                current_stock_kg=1200.0,
                daily_consumption_kg=300.0,
                reorder_threshold_kg=1500.0,
                reorder_alert=True,  # 1200 <= 1500
            )
            inv3 = FeedInventory(
                feed_name="Alfalfa Hay",
                category="Forage",
                current_stock_kg=4800.0,
                daily_consumption_kg=400.0,
                reorder_threshold_kg=2000.0,
                reorder_alert=False,
            )
            db.add(inv1)
            db.add(inv2)
            db.add(inv3)

            db.commit()
    except Exception:
        db.rollback()


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
