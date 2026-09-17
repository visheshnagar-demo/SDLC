import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from server.config import settings
from server.models import Base, Account, ChipDefinition, InventoryBatch


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode("utf-8")[:72]
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)


# Engine setup
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args, pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_data(db):
    try:
        # Check if seeded accounts exist
        admin = (
            db.query(Account).filter(Account.owner_email == "admin@example.com").first()
        )
        if not admin:
            admin = Account(
                account_number="ACC-ADMIN-001",
                owner_name="System Admin",
                owner_email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                role="ADMIN",
                status="ACTIVE",
                is_active=1,
            )
            db.add(admin)

        user = (
            db.query(Account).filter(Account.owner_email == "test@example.com").first()
        )
        if not user:
            user = Account(
                account_number="ACC-USER-001",
                owner_name="Test User",
                owner_email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="USER",
                status="ACTIVE",
                is_active=1,
            )
            db.add(user)

        # Seed sample chip definition & batch if none exist
        chip = (
            db.query(ChipDefinition)
            .filter(ChipDefinition.name == "Standard Gold 100")
            .first()
        )
        if not chip:
            chip = ChipDefinition(
                name="Standard Gold 100",
                category="Standard",
                face_value=100.0,
                status="ACTIVE",
            )
            db.add(chip)
            db.flush()

            batch = InventoryBatch(
                chip_id=chip.id,
                batch_number="BATCH-2026-001",
                total_quantity=10000,
                available_quantity=10000,
                allocated_quantity=0,
                status="AVAILABLE",
            )
            db.add(batch)

        db.commit()
    except Exception:
        db.rollback()
