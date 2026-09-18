import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

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
    from server.models import Category, Supplier, Flower
    import uuid

    # Seed initial categories if none exist
    if not db.query(Category).first():
        cat1 = Category(
            id=str(uuid.uuid4()), name="Roses", description="Various rose species"
        )
        cat2 = Category(
            id=str(uuid.uuid4()), name="Lilies", description="Fresh lily varieties"
        )
        cat3 = Category(
            id=str(uuid.uuid4()), name="Tulips", description="Colorful spring tulips"
        )
        db.add_all([cat1, cat2, cat3])
        db.commit()

    # Seed initial supplier if none exist
    if not db.query(Supplier).first():
        supplier = Supplier(
            id=str(uuid.uuid4()),
            name="Floral Wholesalers Inc.",
            contact_person="Jane Doe",
            email="contact@floralwholesalers.com",
            phone="555-0199",
            address="123 Blossom Way, Spring City",
        )
        db.add(supplier)
        db.commit()

    # Seed initial flower if none exist
    if not db.query(Flower).first():
        cat = db.query(Category).filter(Category.name == "Roses").first()
        supp = (
            db.query(Supplier)
            .filter(Supplier.name == "Floral Wholesalers Inc.")
            .first()
        )
        if cat and supp:
            flower = Flower(
                id=str(uuid.uuid4()),
                name="Red Roses",
                species="Rosa rubiginosa",
                color="Red",
                price_per_stem=2.50,
                stock_quantity=500,
                low_stock_threshold=20,
                freshness_date="2026-06-15",
                care_instructions="Keep in cool water, trim stems diagonally.",
                supplier_id=supp.id,
                category_id=cat.id,
            )
            db.add(flower)
            db.commit()
