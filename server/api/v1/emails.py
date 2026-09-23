from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import (
    EmailRead,
    EmailCreateText,
    CategoryOverride,
    EmailListResponse,
)
from server.services.email_service import (
    create_email_from_text,
    create_email_from_file,
    list_emails,
    get_email_by_id,
    override_email_category,
)

router = APIRouter()


@router.post("/text", response_model=EmailRead, status_code=status.HTTP_201_CREATED)
def ingest_text_endpoint(
    payload: EmailCreateText,
    db: Session = Depends(get_db),
):
    """Ingest an email via raw text payload and perform AI categorization."""
    try:
        email_record = create_email_from_text(
            db, body=payload.body, subject=payload.subject
        )
        return email_record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process text email: {str(e)}",
        )


@router.post("/upload", response_model=EmailRead, status_code=status.HTTP_201_CREATED)
async def upload_file_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Ingest an email via file upload (.eml, .msg, .txt up to 10MB) and perform AI categorization."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename.",
        )

    try:
        content = await file.read()
        email_record = create_email_from_file(
            db, content=content, filename=file.filename
        )
        return email_record
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest file: {str(e)}",
        )


@router.get("", response_model=EmailListResponse)
def list_emails_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List, search, and filter classified emails with pagination."""
    items, total = list_emails(
        db,
        skip=skip,
        limit=limit,
        category=category,
        status=status_filter,
        search=search,
    )
    return EmailListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{email_id}", response_model=EmailRead)
def get_email_endpoint(
    email_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve details of a specific email including audit history."""
    email_record = get_email_by_id(db, email_id)
    if not email_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email with ID '{email_id}' not found",
        )
    return email_record


@router.patch("/{email_id}/override", response_model=EmailRead)
def override_category_endpoint(
    email_id: str,
    payload: CategoryOverride,
    db: Session = Depends(get_db),
):
    """Manually override the AI classification category for an email."""
    try:
        updated_email = override_email_category(
            db,
            email_id=email_id,
            new_category=payload.category,
            reason=payload.reason,
        )
        if not updated_email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Email with ID '{email_id}' not found",
            )
        return updated_email
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
