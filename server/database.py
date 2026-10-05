import uuid
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import StaticPool
from server.config import settings

Base = declarative_base()

# Configure engine based on testing flag or SQLite
connect_args = {}
engine_kwargs = {}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    if ":memory:" in settings.DATABASE_URL or settings.TESTING:
        engine_kwargs["poolclass"] = StaticPool

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args, **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Import all models before creating tables
    Base.metadata.create_all(bind=engine)


def seed_data(db: Session) -> None:
    from server.models.book import Book
    from server.models.patron import Patron

    # Seed initial books idempotently
    sample_books = [
        {
            "id": str(uuid.uuid4()),
            "isbn": "9780743273565",
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "genre": "Fiction",
            "publication_year": 1925,
            "total_copies": 5,
            "available_copies": 5,
        },
        {
            "id": str(uuid.uuid4()),
            "isbn": "9780451524935",
            "title": "1984",
            "author": "George Orwell",
            "genre": "Dystopian",
            "publication_year": 1949,
            "total_copies": 4,
            "available_copies": 4,
        },
        {
            "id": str(uuid.uuid4()),
            "isbn": "9780060935467",
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "genre": "Classic",
            "publication_year": 1960,
            "total_copies": 3,
            "available_copies": 3,
        },
        {
            "id": str(uuid.uuid4()),
            "isbn": "9780141439600",
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "genre": "Romance",
            "publication_year": 1813,
            "total_copies": 4,
            "available_copies": 4,
        },
        {
            "id": str(uuid.uuid4()),
            "isbn": "9780596007126",
            "title": "Head First Design Patterns",
            "author": "Eric Freeman",
            "genre": "Technology",
            "publication_year": 2004,
            "total_copies": 2,
            "available_copies": 2,
        },
    ]

    for b_data in sample_books:
        existing = db.query(Book).filter(Book.isbn == b_data["isbn"]).first()
        if not existing:
            book = Book(**b_data)
            db.add(book)

    # Seed initial patrons idempotently
    sample_patrons = [
        {
            "id": str(uuid.uuid4()),
            "full_name": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone_number": "555-0101",
            "max_borrow_limit": 5,
            "account_status": "ACTIVE",
            "total_fines_due": 0.0,
        },
        {
            "id": str(uuid.uuid4()),
            "full_name": "John Smith",
            "email": "john.smith@example.com",
            "phone_number": "555-0102",
            "max_borrow_limit": 5,
            "account_status": "ACTIVE",
            "total_fines_due": 0.0,
        },
        {
            "id": str(uuid.uuid4()),
            "full_name": "Test User",
            "email": "test@example.com",
            "phone_number": "555-0199",
            "max_borrow_limit": 5,
            "account_status": "ACTIVE",
            "total_fines_due": 0.0,
        },
    ]

    for p_data in sample_patrons:
        existing = db.query(Patron).filter(Patron.email == p_data["email"]).first()
        if not existing:
            patron = Patron(**p_data)
            db.add(patron)

    try:
        db.commit()
    except Exception:
        db.rollback()
