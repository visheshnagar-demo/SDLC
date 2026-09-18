import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flowers.db")

# SQLite specific connect_args
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

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


def seed_data(db: Session):
    from server.models import Category, Supplier, Flower

    # Check if data already exists
    if db.query(Category).first():
        return

    try:
        # Seed Categories
        cat_roses = Category(
            name="Roses", description="Various species and colors of roses"
        )
        cat_lilies = Category(name="Lilies", description="Fragrant lily varieties")
        cat_orchids = Category(name="Orchids", description="Exotic orchid species")
        db.add_all([cat_roses, cat_lilies, cat_orchids])
        db.flush()

        # Seed Suppliers
        supplier_1 = Supplier(
            name="Floral Wholesalers Inc.",
            contact_person="Alice Smith",
            email="alice@floralwholesalers.com",
            phone="555-0192",
            address="123 Garden Way, Floral City",
        )
        supplier_2 = Supplier(
            name="Global Botanical Co.",
            contact_person="Bob Jones",
            email="bob@globalbotanical.com",
            phone="555-0144",
            address="456 Blossom Lane, Greenfield",
        )
        db.add_all([supplier_1, supplier_2])
        db.flush()

        # Seed Flowers
        flower_1 = Flower(
            name="Red Roses",
            species="Rosa rubiginosa",
            color="Red",
            price_per_stem=2.50,
            stock_quantity=500,
            low_stock_threshold=20,
            care_instructions="Trim stems at 45 degrees, keep in cool water.",
            category_id=cat_roses.id,
            supplier_id=supplier_1.id,
        )
        flower_2 = Flower(
            name="White Lilies",
            species="Lilium candidum",
            color="White",
            price_per_stem=3.75,
            stock_quantity=150,
            low_stock_threshold=15,
            care_instructions="Remove anthers to avoid pollen stains.",
            category_id=cat_lilies.id,
            supplier_id=supplier_1.id,
        )
        flower_3 = Flower(
            name="Purple Orchids",
            species="Phalaenopsis",
            color="Purple",
            price_per_stem=5.00,
            stock_quantity=10,  # Below threshold of 12 -> Low stock alert
            low_stock_threshold=12,
            care_instructions="Provide indirect sunlight and moderate humidity.",
            category_id=cat_orchids.id,
            supplier_id=supplier_2.id,
        )
        db.add_all([flower_1, flower_2, flower_3])
        db.commit()
    except Exception:
        db.rollback()
