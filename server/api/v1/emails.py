from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import (
    EmailCreateText,
    EmailRead,
    EmailListResponse,
    CategoryOverride,
)
from server.services import email_service

router = APIRouter(prefix="/emails", tags=["Emails"])


@router.post(
    "/text",
    response_model=EmailRead,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest email via raw text payload",
)
def ingest_text_email(
    email_in: EmailCreateText,
    db: Session = Depends(get_db),
):
    """Ingest email by raw text and automatically classify category."""
    email_obj = email_service.create_email_from_text(db=db, email_in=email_in)
    return email_obj


@router.post(
    "/upload",
    response_model=EmailRead,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest email via file upload",
)
async def ingest_file_email(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Ingest email via .eml, .msg, or .txt file upload up to 10MB."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename.",
        )

    file_bytes = await file.read()
    email_obj = email_service.create_email_from_file(
        db=db, filename=file.filename, file_bytes=file_bytes
    )
    return email_obj


@router.get(
    "",
    response_model=EmailListResponse,
    status_code=status.HTTP_200_OK,
    summary="List and filter classified emails",
)
def list_classified_emails(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by status"
    ),
    search: Optional[str] = Query(
        None, description="Search keyword in subject or body"
    ),
    db: Session = Depends(get_db),
):
    """List emails with pagination, category filter, status filter, and search query."""
    total, items = email_service.list_emails(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        status=status_filter,
        search=search,
    )
    return EmailListResponse(total=total, skip=skip, limit=limit, items=items)


@router.get(
    "/{email_id}",
    response_model=EmailRead,
    status_code=status.HTTP_200_OK,
    summary="Get email detail by UUID",
)
def get_email_detail(
    email_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve full email content and classification details by ID."""
    email_obj = email_service.get_email_by_id(db=db, email_id=email_id)
    if not email_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email with ID '{email_id}' not found.",
        )
    return email_obj


@router.patch(
    "/{email_id}/override",
    response_model=EmailRead,
    status_code=status.HTTP_200_OK,
    summary="Manual classification override",
)
def override_email_classification(
    email_id: str,
    override_in: CategoryOverride,
    db: Session = Depends(get_db),
):
    """Manually override the AI-assigned category and create an audit log entry."""
    valid_categories = {"Work", "Personal", "Urgent", "Promotional", "Uncategorized"}
    if override_in.category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category '{override_in.category}'. Allowed categories: {', '.join(sorted(valid_categories))}",
        )

    email_obj = email_service.override_category(
        db=db, email_id=email_id, new_category=override_in.category
    )
    if not email_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email with ID '{email_id}' not found.",
        )
    return email_obj
