import os
import uuid
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flowers.db")

connect_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args["check_same_thread"] = False

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
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
    from server import models

    # Check if category exists
    if db.query(models.Category).first() is None:
        cat_roses = models.Category(
            id=str(uuid.uuid4()),
            name="Roses",
            description="Classic rose varieties in various colors",
        )
        cat_lilies = models.Category(
            id=str(uuid.uuid4()),
            name="Lilies",
            description="Fragrant and elegant lily species",
        )
        cat_tulips = models.Category(
            id=str(uuid.uuid4()),
            name="Tulips",
            description="Vibrant spring tulip blooms",
        )
        db.add_all([cat_roses, cat_lilies, cat_tulips])
        db.commit()

        # Suppliers
        sup1 = models.Supplier(
            id=str(uuid.uuid4()),
            name="Floral Wholesalers Inc.",
            contact_person="John Floral",
            email="contact@floralwholesalers.com",
            phone="555-0192",
            address="123 Botanical Way, Portland, OR",
        )
        sup2 = models.Supplier(
            id=str(uuid.uuid4()),
            name="Bloom Direct Ltd.",
            contact_person="Sarah Bloom",
            email="info@bloomdirect.com",
            phone="555-0188",
            address="456 Meadow Lane, Denver, CO",
        )
        db.add_all([sup1, sup2])
        db.commit()

        # Flowers
        flower1 = models.Flower(
            id=str(uuid.uuid4()),
            name="Red Roses",
            species="Rosa rubiginosa",
            color="Red",
            price_per_stem=2.50,
            stock_quantity=500,
            low_stock_threshold=20,
            freshness_date=date.today(),
            care_instructions="Keep in cool water, trim stems diagonally every 2 days.",
            category_id=cat_roses.id,
            supplier_id=sup1.id,
        )
        flower2 = models.Flower(
            id=str(uuid.uuid4()),
            name="White Lilies",
            species="Lilium candidum",
            color="White",
            price_per_stem=3.20,
            stock_quantity=150,
            low_stock_threshold=25,
            freshness_date=date.today(),
            care_instructions="Remove stamens to avoid pollen stains, keep in bright indirect light.",
            category_id=cat_lilies.id,
            supplier_id=sup2.id,
        )
        flower3 = models.Flower(
            id=str(uuid.uuid4()),
            name="Yellow Tulips",
            species="Tulipa gesneriana",
            color="Yellow",
            price_per_stem=1.80,
            stock_quantity=15,  # Low stock item for testing low stock alert!
            low_stock_threshold=20,
            freshness_date=date.today(),
            care_instructions="Provide fresh cold water, avoid direct heat.",
            category_id=cat_tulips.id,
            supplier_id=sup1.id,
        )
        db.add_all([flower1, flower2, flower3])
        db.commit()
