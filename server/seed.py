from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from server.models import User, Cow, HealthRecord, MilkYieldLog
from server.auth import hash_password


def seed_data(db: Session):
    # 1. Seed Users
    users_data = [
        {
            "email": "test@example.com",
            "password": "testpassword",
            "full_name": "Farm Worker Test",
            "role": "farm_worker",
        },
        {
            "email": "admin@example.com",
            "password": "adminpassword",
            "full_name": "Farm Manager Admin",
            "role": "farm_manager",
        },
    ]

    seeded_users = {}
    for u in users_data:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            new_user = User(
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                is_active=True,
            )
            db.add(new_user)
            try:
                db.commit()
                db.refresh(new_user)
                seeded_users[u["email"]] = new_user
            except IntegrityError:
                db.rollback()
                existing = db.query(User).filter(User.email == u["email"]).first()
                seeded_users[u["email"]] = existing
        else:
            seeded_users[u["email"]] = existing

    # 2. Seed Cows
    today = date.today()
    cows_data = [
        {
            "tag_id": "COW-1001",
            "breed": "Holstein",
            "date_of_birth": today - timedelta(days=365 * 3),
            "gender": "Female",
            "health_status": "Healthy",
            "weight_kg": 640.0,
            "location": "Barn A",
        },
        {
            "tag_id": "COW-1042",
            "breed": "Holstein",
            "date_of_birth": today - timedelta(days=365 * 4),
            "gender": "Female",
            "health_status": "Under Treatment",
            "weight_kg": 620.0,
            "location": "Barn A",
        },
        {
            "tag_id": "COW-1088",
            "breed": "Jersey",
            "date_of_birth": today - timedelta(days=365 * 2),
            "gender": "Female",
            "health_status": "Healthy",
            "weight_kg": 450.0,
            "location": "Pasture 1",
        },
        {
            "tag_id": "COW-2005",
            "breed": "Angus",
            "date_of_birth": today - timedelta(days=365 * 5),
            "gender": "Male",
            "health_status": "Healthy",
            "weight_kg": 850.0,
            "location": "Pasture 2",
        },
    ]

    seeded_cows = {}
    for c in cows_data:
        existing_cow = db.query(Cow).filter(Cow.tag_id == c["tag_id"]).first()
        if not existing_cow:
            new_cow = Cow(
                tag_id=c["tag_id"],
                breed=c["breed"],
                date_of_birth=c["date_of_birth"],
                gender=c["gender"],
                health_status=c["health_status"],
                weight_kg=c["weight_kg"],
                location=c["location"],
            )
            db.add(new_cow)
            try:
                db.commit()
                db.refresh(new_cow)
                seeded_cows[c["tag_id"]] = new_cow
            except IntegrityError:
                db.rollback()
                existing_cow = db.query(Cow).filter(Cow.tag_id == c["tag_id"]).first()
                seeded_cows[c["tag_id"]] = existing_cow
        else:
            seeded_cows[c["tag_id"]] = existing_cow

    # 3. Seed Health Records
    cow_1042 = seeded_cows.get("COW-1042")
    if cow_1042:
        existing_hr = (
            db.query(HealthRecord).filter(HealthRecord.cow_id == cow_1042.id).first()
        )
        if not existing_hr:
            hr1 = HealthRecord(
                cow_id=cow_1042.id,
                record_type="Treatment",
                title="Suspected Mastitis Follow-up",
                diagnosis="Mild inflammation detected in left rear quarter",
                treatment_plan="Intramammary antibiotic infusion for 3 days",
                event_date=today - timedelta(days=2),
                next_due_date=today + timedelta(days=5),
                administered_by="Dr. Sarah Jenkins",
            )
            hr2 = HealthRecord(
                cow_id=cow_1042.id,
                record_type="Vaccination",
                title="BVD Phase 1 Vaccination",
                diagnosis="Annual vaccination schedule",
                treatment_plan="2ml intramuscular injection",
                event_date=today - timedelta(days=60),
                next_due_date=today + timedelta(days=300),
                administered_by="Dr. Sarah Jenkins",
            )
            db.add_all([hr1, hr2])
            try:
                db.commit()
            except Exception:
                db.rollback()

    # 4. Seed Milk Yield Logs for COW-1001 and COW-1042
    cow_1001 = seeded_cows.get("COW-1001")
    if cow_1001:
        existing_ml = (
            db.query(MilkYieldLog).filter(MilkYieldLog.cow_id == cow_1001.id).first()
        )
        if not existing_ml:
            for i in range(1, 8):
                log_d = today - timedelta(days=i)
                morning = 13.0 + (i % 3) * 0.5
                evening = 12.0 + (i % 2) * 0.4
                total = morning + evening
                db.add(
                    MilkYieldLog(
                        cow_id=cow_1001.id,
                        logging_date=log_d,
                        morning_yield_liters=morning,
                        evening_yield_liters=evening,
                        total_yield_liters=total,
                        yield_drop_alert=False,
                        notes="Normal production",
                    )
                )
            try:
                db.commit()
            except Exception:
                db.rollback()

    if cow_1042:
        existing_ml2 = (
            db.query(MilkYieldLog).filter(MilkYieldLog.cow_id == cow_1042.id).first()
        )
        if not existing_ml2:
            # Seed 7 days average around 24.0, then a drop
            for i in range(1, 8):
                log_d = today - timedelta(days=i)
                morning = 12.0
                evening = 12.0
                total = morning + evening
                db.add(
                    MilkYieldLog(
                        cow_id=cow_1042.id,
                        logging_date=log_d,
                        morning_yield_liters=morning,
                        evening_yield_liters=evening,
                        total_yield_liters=total,
                        yield_drop_alert=False,
                        notes="Normal yield log",
                    )
                )
            try:
                db.commit()
            except Exception:
                db.rollback()
