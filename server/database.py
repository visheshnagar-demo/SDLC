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


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def init_db():
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    from server.models import User, Cell, Inmate, VisitorBlacklist

    # Seed regular guard user
    try:
        guard = db.query(User).filter(User.email == "test@example.com").first()
        if not guard:
            guard = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="GUARD",
                is_active=True,
                is_verified=True,
            )
            db.add(guard)
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
                role="ADMIN",
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed medical staff user
    try:
        medical = db.query(User).filter(User.email == "medical@example.com").first()
        if not medical:
            medical = User(
                id=str(uuid.uuid4()),
                email="medical@example.com",
                hashed_password=get_password_hash("medicalpassword"),
                role="MEDICAL",
                is_active=True,
                is_verified=True,
            )
            db.add(medical)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed initial cell blocks
    cells_data = [
        {"cell_number": "A-101", "block_name": "Block A", "capacity": 2, "security_tier": "MINIMUM"},
        {"cell_number": "B-104", "block_name": "Block B", "capacity": 2, "security_tier": "MEDIUM"},
        {"cell_number": "C-301", "block_name": "Block C", "capacity": 2, "security_tier": "HIGH_SECURITY"},
        {"cell_number": "D-401", "block_name": "Block D", "capacity": 1, "security_tier": "MAXIMUM"},
    ]
    for c_data in cells_data:
        try:
            cell = db.query(Cell).filter(Cell.cell_number == c_data["cell_number"]).first()
            if not cell:
                cell = Cell(
                    id=str(uuid.uuid4()),
                    cell_number=c_data["cell_number"],
                    block_name=c_data["block_name"],
                    capacity=c_data["capacity"],
                    current_occupancy=0,
                    security_tier=c_data["security_tier"],
                    is_active=True,
                )
                db.add(cell)
                db.commit()
        except IntegrityError:
            db.rollback()

    # Seed initial banned visitor
    try:
        banned = db.query(VisitorBlacklist).filter(VisitorBlacklist.visitor_id_number == "DL-9823411").first()
        if not banned:
            banned = VisitorBlacklist(
                id=str(uuid.uuid4()),
                visitor_id_number="DL-9823411",
                reason="Attempted smuggling of prohibited contraband",
                banned_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),
            )
            db.add(banned)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed initial inmate
    try:
        inmate = db.query(Inmate).filter(Inmate.inmate_number == "INM-1001").first()
        if not inmate:
            cell = db.query(Cell).filter(Cell.cell_number == "B-104").first()
            inmate = Inmate(
                id=str(uuid.uuid4()),
                inmate_number="INM-1001",
                first_name="Marcus",
                last_name="Vance",
                date_of_birth="1985-06-15",
                security_tier="MEDIUM",
                cell_id=cell.id if cell else None,
                medical_alerts='["DIABETIC_TYPE_1"]',
                offense_history='[{"code": "OFF-201", "description": "Grand Larceny"}]',
                emergency_contacts='[{"name": "Sarah Vance", "relation": "Sister", "phone": "555-0144"}]',
            )
            db.add(inmate)
            if cell:
                cell.current_occupancy = 1
            db.commit()
    except IntegrityError:
        db.rollback()
