import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from server.config import settings

# For SQLite, ensure check_same_thread=False
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args, pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import all models to ensure they are registered on Base.metadata

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    from server.models.user import User
    from server.models.warehouse import Warehouse

    # Seed test users idempotently
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        test_user = User(
            id=str(uuid.uuid4()),
            email="test@example.com",
            full_name="Test User",
            role="inventory_manager",
            is_active=True,
        )
        db.add(test_user)

    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            full_name="Admin User",
            role="admin",
            is_active=True,
        )
        db.add(admin_user)

    # Seed default warehouses idempotently
    wh_a = db.query(Warehouse).filter(Warehouse.code == "WH-MAIN").first()
    if not wh_a:
        wh_a = Warehouse(
            id=str(uuid.uuid4()),
            code="WH-MAIN",
            name="Main Warehouse",
            location="Building A, Central Hub",
        )
        db.add(wh_a)

    wh_b = db.query(Warehouse).filter(Warehouse.code == "WH-WEST").first()
    if not wh_b:
        wh_b = Warehouse(
            id=str(uuid.uuid4()),
            code="WH-WEST",
            name="West Coast Facility",
            location="Building B, West Sector",
        )
        db.add(wh_b)

    db.commit()
