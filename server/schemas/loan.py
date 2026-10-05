from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from server.schemas.book import BookResponse
from server.schemas.patron import PatronResponse


class LoanCheckoutRequest(BaseModel):
    patron_id: str = Field(..., description="UUID of the borrowing patron")
    book_id: str = Field(..., description="UUID of the book to checkout")


class LoanResponse(BaseModel):
    id: str
    book_id: str
    patron_id: str
    checkout_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    status: str
    fine_amount: float
    created_at: datetime
    updated_at: datetime
    book: Optional[BookResponse] = None
    patron: Optional[PatronResponse] = None

    model_config = ConfigDict(from_attributes=True)


class OverdueLoanResponse(BaseModel):
    id: str
    book_id: str
    patron_id: str
    checkout_date: datetime
    due_date: datetime
    status: str
    overdue_days: int
    fine_amount: float
    book_title: Optional[str] = None
    patron_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
