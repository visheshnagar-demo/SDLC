import uuid
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.models.book import Book
from server.models.loan import Loan
from server.schemas.book import BookCreate, BookUpdate


class BookService:
    @staticmethod
    def create_book(db: Session, book_in: BookCreate) -> Book:
        existing = db.query(Book).filter(Book.isbn == book_in.isbn).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A book with ISBN '{book_in.isbn}' already exists.",
            )

        book = Book(
            id=str(uuid.uuid4()),
            isbn=book_in.isbn,
            title=book_in.title,
            author=book_in.author,
            genre=book_in.genre,
            publication_year=book_in.publication_year,
            total_copies=book_in.total_copies,
            available_copies=book_in.total_copies,
        )
        db.add(book)
        db.commit()
        db.refresh(book)
        return book

    @staticmethod
    def get_books(
        db: Session,
        search: Optional[str] = None,
        genre: Optional[str] = None,
        available_only: bool = False,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Book]:
        query = db.query(Book)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Book.title.ilike(search_pattern),
                    Book.author.ilike(search_pattern),
                    Book.genre.ilike(search_pattern),
                    Book.isbn.ilike(search_pattern),
                )
            )

        if genre:
            query = query.filter(Book.genre.ilike(f"%{genre}%"))

        if available_only:
            query = query.filter(Book.available_copies > 0)

        return query.order_by(Book.title.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_book_by_id(db: Session, book_id: str) -> Book:
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Book with ID '{book_id}' not found.",
            )
        return book

    @staticmethod
    def update_book(db: Session, book_id: str, book_update: BookUpdate) -> Book:
        book = BookService.get_book_by_id(db, book_id)

        update_data = book_update.model_dump(exclude_unset=True)

        if "total_copies" in update_data and update_data["total_copies"] is not None:
            active_loans = (
                db.query(Loan)
                .filter(Loan.book_id == book_id, Loan.status == "ACTIVE")
                .count()
            )
            new_total = update_data["total_copies"]
            if new_total < active_loans:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot reduce total copies below currently borrowed copies.",
                )
            book.available_copies = new_total - active_loans
            book.total_copies = new_total

        for key, value in update_data.items():
            if key != "total_copies" and value is not None:
                setattr(book, key, value)

        db.commit()
        db.refresh(book)
        return book

    @staticmethod
    def delete_book(db: Session, book_id: str) -> None:
        book = BookService.get_book_by_id(db, book_id)
        active_loans = (
            db.query(Loan)
            .filter(Loan.book_id == book_id, Loan.status == "ACTIVE")
            .count()
        )
        if active_loans > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete book while active loans are outstanding.",
            )
        db.delete(book)
        db.commit()
