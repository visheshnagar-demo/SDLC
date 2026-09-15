import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from server.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Import all models to ensure they register on Base.metadata
    from server.models.user import User  # noqa: F401
    from server.models.membership import MembershipPlan, UserMembership  # noqa: F401
    from server.models.fitness_class import FitnessClass  # noqa: F401
    from server.models.booking import ClassBooking  # noqa: F401

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session) -> None:
    from server.core.security import get_password_hash
    from server.models.user import User
    from server.models.membership import MembershipPlan, UserMembership
    from server.models.fitness_class import FitnessClass

    # 1. Seed Membership Plans
    plans_data = [
        {
            "code": "DAY_PASS",
            "name": "Day Pass",
            "price_monthly": 25.0,
            "description": "Single-day access to general gym floor and locker rooms.",
            "benefits": json.dumps(
                [
                    "Single-day gym access",
                    "Cardio and strength floor",
                    "Locker room access",
                ]
            ),
            "is_active": True,
        },
        {
            "code": "MONTHLY_STD",
            "name": "Monthly Standard",
            "price_monthly": 69.0,
            "description": "Unlimited monthly access to gym facilities and group fitness classes.",
            "benefits": json.dumps(
                [
                    "Unlimited 24/7 gym access",
                    "All unisex group classes",
                    "Locker & sauna access",
                    "1 Free guest pass/mo",
                ]
            ),
            "is_active": True,
        },
        {
            "code": "ANNUAL_PREM",
            "name": "Annual Premium",
            "price_monthly": 799.0,
            "description": "Complete VIP annual membership with trainer consultations and VIP amenities.",
            "benefits": json.dumps(
                [
                    "All Monthly Standard benefits",
                    "1-on-1 trainer consultation",
                    "Complimentary towel service",
                    "Unlimited guest passes",
                    "Priority class booking",
                ]
            ),
            "is_active": True,
        },
    ]

    plan_map = {}
    for p_data in plans_data:
        plan = (
            db.query(MembershipPlan)
            .filter(MembershipPlan.code == p_data["code"])
            .first()
        )
        if not plan:
            plan = MembershipPlan(
                id=str(uuid.uuid4()),
                code=p_data["code"],
                name=p_data["name"],
                price_monthly=p_data["price_monthly"],
                description=p_data["description"],
                benefits=p_data["benefits"],
                is_active=p_data["is_active"],
            )
            db.add(plan)
            db.commit()
            db.refresh(plan)
        plan_map[plan.code] = plan

    # 2. Seed Users
    # Regular test user
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        test_user = User(
            id=str(uuid.uuid4()),
            email="test@example.com",
            hashed_password=get_password_hash("testpassword"),
            full_name="Alex Morgan",
            phone_number="+1-555-0199",
            fitness_goals="Strength training and cardiovascular endurance",
            emergency_contact="Jordan Morgan (+1-555-0188)",
            role="MEMBER",
            is_active=True,
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    # Admin test user
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            hashed_password=get_password_hash("adminpassword"),
            full_name="Admin Staff",
            phone_number="+1-555-0100",
            fitness_goals="Facility management and trainer supervision",
            emergency_contact="Gym HQ (+1-555-0101)",
            role="ADMIN",
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    # 3. Seed active membership for test_user and admin_user
    for u in [test_user, admin_user]:
        existing_sub = (
            db.query(UserMembership)
            .filter(UserMembership.user_id == u.id, UserMembership.status == "ACTIVE")
            .first()
        )
        if not existing_sub and "MONTHLY_STD" in plan_map:
            sub = UserMembership(
                id=str(uuid.uuid4()),
                user_id=u.id,
                plan_id=plan_map["MONTHLY_STD"].id,
                status="ACTIVE",
                start_date=datetime.now(timezone.utc),
                end_date=datetime.now(timezone.utc) + timedelta(days=365),
            )
            db.add(sub)
            db.commit()

    # 4. Seed initial Fitness Classes
    now = datetime.now(timezone.utc)
    base_date = now.replace(minute=0, second=0, microsecond=0)

    classes_data = [
        {
            "title": "HIIT Full Body Burn",
            "category": "HIIT",
            "description": "High-intensity unisex interval training suitable for all fitness levels.",
            "instructor_name": "Taylor Reed",
            "start_time": base_date + timedelta(days=1, hours=7),
            "end_time": base_date + timedelta(days=1, hours=8),
            "max_capacity": 20,
            "booked_count": 5,
        },
        {
            "title": "Power Vinyasa Yoga",
            "category": "Yoga",
            "description": "Dynamic flow combining breath and strength for all genders.",
            "instructor_name": "Jordan Lee",
            "start_time": base_date + timedelta(days=1, hours=9, minutes=30),
            "end_time": base_date + timedelta(days=1, hours=10, minutes=30),
            "max_capacity": 18,
            "booked_count": 18,
        },
        {
            "title": "Strength & Conditioning",
            "category": "Strength",
            "description": "Barbell, kettlebell, and bodyweight functional strength workout.",
            "instructor_name": "Sam Rivera",
            "start_time": base_date + timedelta(days=2, hours=17, minutes=30),
            "end_time": base_date + timedelta(days=2, hours=18, minutes=30),
            "max_capacity": 15,
            "booked_count": 8,
        },
        {
            "title": "Cardio Spin Revolution",
            "category": "Spin",
            "description": "High-energy indoor cycling rhythm ride with sprint and climb intervals.",
            "instructor_name": "Alex Parker",
            "start_time": base_date + timedelta(days=3, hours=8),
            "end_time": base_date + timedelta(days=3, hours=9),
            "max_capacity": 25,
            "booked_count": 12,
        },
        {
            "title": "Core & Mat Pilates",
            "category": "Pilates",
            "description": "Core-strengthening and postural alignment workout designed for every body.",
            "instructor_name": "Casey Quinn",
            "start_time": base_date + timedelta(days=4, hours=18),
            "end_time": base_date + timedelta(days=4, hours=19),
            "max_capacity": 15,
            "booked_count": 3,
        },
    ]

    for c_data in classes_data:
        existing_class = (
            db.query(FitnessClass)
            .filter(
                FitnessClass.title == c_data["title"],
                FitnessClass.start_time == c_data["start_time"],
            )
            .first()
        )
        if not existing_class:
            fitness_class = FitnessClass(
                id=str(uuid.uuid4()),
                title=c_data["title"],
                category=c_data["category"],
                description=c_data["description"],
                instructor_name=c_data["instructor_name"],
                start_time=c_data["start_time"],
                end_time=c_data["end_time"],
                max_capacity=c_data["max_capacity"],
                booked_count=c_data["booked_count"],
            )
            db.add(fitness_class)
            db.commit()
