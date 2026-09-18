import os
import uuid
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/ganesh_temple.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


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
    from server import models

    # Check if admin already exists
    admin_user = (
        db.query(models.User).filter(models.User.email == "admin@example.com").first()
    )
    if not admin_user:
        admin_user = models.User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            full_name="Temple Administrator",
            hashed_password=get_password_hash("adminpassword"),
            role="admin",
            is_active=True,
        )
        db.add(admin_user)

    # Check if test user exists
    test_user = (
        db.query(models.User).filter(models.User.email == "test@example.com").first()
    )
    if not test_user:
        test_user = models.User(
            id=str(uuid.uuid4()),
            email="test@example.com",
            full_name="Devotee User",
            hashed_password=get_password_hash("testpassword"),
            role="devotee",
            is_active=True,
        )
        db.add(test_user)

    # Check if priest user exists
    priest_user = (
        db.query(models.User).filter(models.User.email == "priest@example.com").first()
    )
    if not priest_user:
        priest_user = models.User(
            id=str(uuid.uuid4()),
            email="priest@example.com",
            full_name="Head Priest Acharya",
            hashed_password=get_password_hash("priestpassword"),
            role="priest",
            is_active=True,
        )
        db.add(priest_user)

    # Check if cashier user exists
    cashier_user = (
        db.query(models.User).filter(models.User.email == "cashier@example.com").first()
    )
    if not cashier_user:
        cashier_user = models.User(
            id=str(uuid.uuid4()),
            email="cashier@example.com",
            full_name="Counter Cashier",
            hashed_password=get_password_hash("cashierpassword"),
            role="cashier",
            is_active=True,
        )
        db.add(cashier_user)

    db.commit()

    # Seed Devotee profile for test user
    devotee = (
        db.query(models.Devotee)
        .filter(models.Devotee.devotee_number == "DEV-2026-00001")
        .first()
    )
    if not devotee:
        devotee = models.Devotee(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            devotee_number="DEV-2026-00001",
            phone="9876543210",
            address="123 Temple Road, Mumbai",
        )
        db.add(devotee)
        db.commit()

    # Seed Pooja catalog items
    poojas = [
        {
            "code": "ARCH-01",
            "name": "Sahasranama Archana",
            "description": "1000 names chanting offering to Lord Ganesha",
            "default_price": 101.0,
            "duration_minutes": 30,
            "max_capacity": 50,
        },
        {
            "code": "ABHI-01",
            "name": "Maha Ganapati Abhishekam",
            "description": "Holy bath ritual with milk, honey and panchamrit",
            "default_price": 501.0,
            "duration_minutes": 60,
            "max_capacity": 20,
        },
        {
            "code": "MODK-01",
            "name": "108 Modak Archana",
            "description": "Special Modak offering and archana ritual",
            "default_price": 251.0,
            "duration_minutes": 45,
            "max_capacity": 30,
        },
        {
            "code": "MAHO-01",
            "name": "Ganesh Chaturthi Mahotsav Pooja",
            "description": "Grand festival pooja with special sankalpa",
            "default_price": 1001.0,
            "duration_minutes": 120,
            "max_capacity": 100,
        },
    ]
    for p in poojas:
        existing_p = (
            db.query(models.PoojaCatalog)
            .filter(models.PoojaCatalog.code == p["code"])
            .first()
        )
        if not existing_p:
            pooja_item = models.PoojaCatalog(
                id=str(uuid.uuid4()),
                code=p["code"],
                name=p["name"],
                description=p["description"],
                default_price=p["default_price"],
                duration_minutes=p["duration_minutes"],
                max_capacity=p["max_capacity"],
                is_active=True,
            )
            db.add(pooja_item)
            db.commit()

            # Seed a slot for this pooja
            slot = models.PoojaSlot(
                id=str(uuid.uuid4()),
                pooja_id=pooja_item.id,
                priest_id=priest_user.id,
                slot_date="2026-06-01",
                start_time="09:00",
                end_time="09:30",
                capacity=p["max_capacity"],
                booked_count=0,
                status="open",
            )
            db.add(slot)
            db.commit()

    # Seed Inventory items
    inventory_items = [
        {
            "item_code": "ING-GHEE",
            "item_name": "Pure Cow Ghee",
            "category": "prasadam",
            "unit_of_measure": "kg",
            "current_stock": 50.0,
            "minimum_threshold": 10.0,
            "is_precious_asset": False,
        },
        {
            "item_code": "ING-RICE",
            "item_name": "Akshata Pooja Rice",
            "category": "pooja_item",
            "unit_of_measure": "kg",
            "current_stock": 100.0,
            "minimum_threshold": 20.0,
            "is_precious_asset": False,
        },
        {
            "item_code": "ING-CAMPHOR",
            "item_name": "Bhimseni Camphor",
            "category": "pooja_item",
            "unit_of_measure": "kg",
            "current_stock": 5.0,
            "minimum_threshold": 8.0,
            "is_precious_asset": False,
        },  # low stock alert
        {
            "item_code": "AST-GOLD-CROWN",
            "item_name": "22K Gold Ganesha Crown (Kirita)",
            "category": "precious_asset",
            "unit_of_measure": "grams",
            "current_stock": 250.0,
            "minimum_threshold": 250.0,
            "is_precious_asset": True,
        },
    ]
    for inv in inventory_items:
        existing_inv = (
            db.query(models.InventoryItem)
            .filter(models.InventoryItem.item_code == inv["item_code"])
            .first()
        )
        if not existing_inv:
            item = models.InventoryItem(
                id=str(uuid.uuid4()),
                item_code=inv["item_code"],
                item_name=inv["item_name"],
                category=inv["category"],
                unit_of_measure=inv["unit_of_measure"],
                current_stock=inv["current_stock"],
                minimum_threshold=inv["minimum_threshold"],
                is_precious_asset=inv["is_precious_asset"],
            )
            db.add(item)
    db.commit()
