from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.book import BookCreate, BookUpdate, BookResponse
from server.services.book_service import BookService

router = APIRouter(prefix="/books", tags=["Books"])


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(book_in: BookCreate, db: Session = Depends(get_db)):
    return BookService.create_book(db, book_in)


@router.get("", response_model=List[BookResponse])
def list_books(
    search: Optional[str] = Query(
        None, description="Search keyword matching title, author, genre, or ISBN"
    ),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    available_only: bool = Query(
        False, description="Filter only books with available copies > 0"
    ),
    skip: int = Query(0, ge=0, description="Offset records"),
    limit: int = Query(20, ge=1, le=100, description="Limit records"),
    db: Session = Depends(get_db),
):
    return BookService.get_books(
        db=db,
        search=search,
        genre=genre,
        available_only=available_only,
        skip=skip,
        limit=limit,
    )


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: str, db: Session = Depends(get_db)):
    return BookService.get_book_by_id(db, book_id)


@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: str, book_update: BookUpdate, db: Session = Depends(get_db)):
    return BookService.update_book(db, book_id, book_update)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: str, db: Session = Depends(get_db)):
    BookService.delete_book(db, book_id)
    return None
