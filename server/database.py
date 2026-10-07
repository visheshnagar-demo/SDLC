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
    # Use native bcrypt with truncation to 72 bytes
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode("utf-8")[:72]
    hash_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(pwd_bytes, hash_bytes)


def init_db():
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    from server.models import User, Room, Guest, Booking, Invoice, InvoiceItem

    # 1. Seed regular test user
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="staff",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
    except IntegrityError:
        db.rollback()

    # 2. Seed admin user
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

    # 3. Seed Rooms
    initial_rooms = [
        {
            "room_number": "101",
            "room_category": "Deluxe",
            "base_rate_per_night": 150.00,
            "status": "Available",
            "floor_number": 1,
            "max_occupancy": 2,
            "amenities": ["King Bed", "Ocean View", "Balcony", "Free Wi-Fi"],
        },
        {
            "room_number": "102",
            "room_category": "Standard",
            "base_rate_per_night": 100.00,
            "status": "Available",
            "floor_number": 1,
            "max_occupancy": 2,
            "amenities": ["Queen Bed", "Free Wi-Fi", "TV"],
        },
        {
            "room_number": "103",
            "room_category": "Suite",
            "base_rate_per_night": 250.00,
            "status": "Available",
            "floor_number": 1,
            "max_occupancy": 4,
            "amenities": [
                "King Bed",
                "Living Room",
                "Jacuzzi",
                "Ocean View",
                "Free Wi-Fi",
            ],
        },
        {
            "room_number": "201",
            "room_category": "Standard",
            "base_rate_per_night": 110.00,
            "status": "Occupied",
            "floor_number": 2,
            "max_occupancy": 2,
            "amenities": ["Queen Bed", "Free Wi-Fi", "Work Desk"],
        },
        {
            "room_number": "202",
            "room_category": "Deluxe",
            "base_rate_per_night": 160.00,
            "status": "Available",
            "floor_number": 2,
            "max_occupancy": 2,
            "amenities": ["King Bed", "Balcony", "Mini Bar", "Free Wi-Fi"],
        },
        {
            "room_number": "203",
            "room_category": "Suite",
            "base_rate_per_night": 300.00,
            "status": "Under Maintenance",
            "floor_number": 2,
            "max_occupancy": 4,
            "amenities": ["2 King Beds", "Living Room", "Kitchenette", "Balcony"],
        },
        {
            "room_number": "204",
            "room_category": "Suite",
            "base_rate_per_night": 280.00,
            "status": "Available",
            "floor_number": 2,
            "max_occupancy": 4,
            "amenities": ["Living Room", "Mini Bar", "Jacuzzi", "King Bed"],
        },
    ]

    for r_data in initial_rooms:
        try:
            existing = (
                db.query(Room).filter(Room.room_number == r_data["room_number"]).first()
            )
            if not existing:
                room = Room(
                    id=str(uuid.uuid4()),
                    room_number=r_data["room_number"],
                    room_category=r_data["room_category"],
                    base_rate_per_night=r_data["base_rate_per_night"],
                    status=r_data["status"],
                    floor_number=r_data["floor_number"],
                    max_occupancy=r_data["max_occupancy"],
                    amenities=json.dumps(r_data["amenities"]),
                )
                db.add(room)
                db.commit()
        except IntegrityError:
            db.rollback()

    # 4. Seed Guests
    initial_guests = [
        {
            "full_name": "Eleanor Vance",
            "email": "eleanor.vance@example.com",
            "phone_number": "+1-555-0199",
            "id_proof_type": "Passport",
            "id_proof_number": "P98741203",
            "address": "42 Crestview Terrace, Boston MA",
            "vip_status": True,
        },
        {
            "full_name": "John Smith",
            "email": "john.smith@example.com",
            "phone_number": "+1-555-0144",
            "id_proof_type": "Driver License",
            "id_proof_number": "DL-8839210",
            "address": "100 Main St, New York NY",
            "vip_status": False,
        },
    ]

    for g_data in initial_guests:
        try:
            existing = db.query(Guest).filter(Guest.email == g_data["email"]).first()
            if not existing:
                guest = Guest(
                    id=str(uuid.uuid4()),
                    full_name=g_data["full_name"],
                    email=g_data["email"],
                    phone_number=g_data["phone_number"],
                    id_proof_type=g_data["id_proof_type"],
                    id_proof_number=g_data["id_proof_number"],
                    address=g_data["address"],
                    vip_status=g_data["vip_status"],
                )
                db.add(guest)
                db.commit()
        except IntegrityError:
            db.rollback()

    # 5. Seed sample booking & invoice for John Smith in Room 201
    try:
        guest_john = (
            db.query(Guest).filter(Guest.email == "john.smith@example.com").first()
        )
        room_201 = db.query(Room).filter(Room.room_number == "201").first()
        if guest_john and room_201:
            existing_booking = (
                db.query(Booking)
                .filter(Booking.booking_reference == "BK-2026-90412")
                .first()
            )
            if not existing_booking:
                today_str = datetime.date.today().isoformat()
                tomorrow_str = (
                    datetime.date.today() + datetime.timedelta(days=2)
                ).isoformat()
                booking = Booking(
                    id=str(uuid.uuid4()),
                    booking_reference="BK-2026-90412",
                    room_id=room_201.id,
                    guest_id=guest_john.id,
                    check_in_date=today_str,
                    check_out_date=tomorrow_str,
                    total_nights=2,
                    total_amount=220.00,
                    booking_status="CheckedIn",
                    actual_check_in=datetime.datetime.now(
                        datetime.timezone.utc
                    ).replace(tzinfo=None),
                    special_requests="High floor, extra towels",
                )
                db.add(booking)
                db.commit()

                # Create Invoice for this booking
                invoice = Invoice(
                    id=str(uuid.uuid4()),
                    invoice_number="INV-2026-00481",
                    booking_id=booking.id,
                    guest_id=guest_john.id,
                    room_charges=220.00,
                    service_charges=30.00,
                    tax_amount=25.00,
                    total_payable=275.00,
                    payment_status="Pending",
                )
                db.add(invoice)
                db.commit()

                item1 = InvoiceItem(
                    id=str(uuid.uuid4()),
                    invoice_id=invoice.id,
                    description=f"Room 201 - 2 Nights @ ${room_201.base_rate_per_night:.2f}/night",
                    item_type="RoomFee",
                    unit_price=room_201.base_rate_per_night,
                    quantity=2,
                    total_price=220.00,
                )
                item2 = InvoiceItem(
                    id=str(uuid.uuid4()),
                    invoice_id=invoice.id,
                    description="Room Service - Breakfast",
                    item_type="Dining",
                    unit_price=30.00,
                    quantity=1,
                    total_price=30.00,
                )
                db.add(item1)
                db.add(item2)
                db.commit()
    except IntegrityError:
        db.rollback()
