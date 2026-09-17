import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import IntegrityError
from server.config import settings

# For SQLite compatibility
connect_args = (
    {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_data(db):
    from server.models import Account, ChipDefinition, InventoryBatch, AccountBalance

    # 1. Seed Accounts
    admin_account = (
        db.query(Account).filter(Account.owner_email == "admin@example.com").first()
    )
    if not admin_account:
        admin_account = Account(
            id=str(uuid.uuid4()),
            account_number="ACC-ADMIN-001",
            owner_name="System Admin",
            owner_email="admin@example.com",
            role="admin",
            status="active",
        )
        db.add(admin_account)

    test_account = (
        db.query(Account).filter(Account.owner_email == "test@example.com").first()
    )
    if not test_account:
        test_account = Account(
            id=str(uuid.uuid4()),
            account_number="ACC-USER-001",
            owner_name="Test User",
            owner_email="test@example.com",
            role="user",
            status="active",
        )
        db.add(test_account)

    user_b_account = (
        db.query(Account).filter(Account.owner_email == "userb@example.com").first()
    )
    if not user_b_account:
        user_b_account = Account(
            id=str(uuid.uuid4()),
            account_number="ACC-USER-002",
            owner_name="User B",
            owner_email="userb@example.com",
            role="user",
            status="active",
        )
        db.add(user_b_account)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

    # Refetch
    admin_account = (
        db.query(Account).filter(Account.owner_email == "admin@example.com").first()
    )
    test_account = (
        db.query(Account).filter(Account.owner_email == "test@example.com").first()
    )
    user_b_account = (
        db.query(Account).filter(Account.owner_email == "userb@example.com").first()
    )

    # 2. Seed Chip Definition & Batch
    chip_gold = (
        db.query(ChipDefinition).filter(ChipDefinition.name == "Gold 100").first()
    )
    if not chip_gold:
        chip_gold = ChipDefinition(
            id=str(uuid.uuid4()),
            name="Gold 100",
            category="Premium",
            face_value=100.0,
            status="active",
        )
        db.add(chip_gold)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            chip_gold = (
                db.query(ChipDefinition)
                .filter(ChipDefinition.name == "Gold 100")
                .first()
            )

    if chip_gold:
        batch = (
            db.query(InventoryBatch)
            .filter(InventoryBatch.chip_id == chip_gold.id)
            .first()
        )
        if not batch:
            batch = InventoryBatch(
                id=str(uuid.uuid4()),
                chip_id=chip_gold.id,
                batch_number="BATCH-GOLD-001",
                total_quantity=10000,
                available_quantity=10000,
                allocated_quantity=0,
                status="active",
            )
            db.add(batch)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()

        # Seed balances
        if test_account:
            bal_a = (
                db.query(AccountBalance)
                .filter(
                    AccountBalance.account_id == test_account.id,
                    AccountBalance.chip_id == chip_gold.id,
                )
                .first()
            )
            if not bal_a:
                bal_a = AccountBalance(
                    id=str(uuid.uuid4()),
                    account_id=test_account.id,
                    chip_id=chip_gold.id,
                    balance=1000,
                )
                db.add(bal_a)

        if user_b_account:
            bal_b = (
                db.query(AccountBalance)
                .filter(
                    AccountBalance.account_id == user_b_account.id,
                    AccountBalance.chip_id == chip_gold.id,
                )
                .first()
            )
            if not bal_b:
                bal_b = AccountBalance(
                    id=str(uuid.uuid4()),
                    account_id=user_b_account.id,
                    chip_id=chip_gold.id,
                    balance=500,
                )
                db.add(bal_b)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
