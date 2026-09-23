from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import (
    EmailRead,
    EmailCreateText,
    CategoryOverride,
    EmailListResponse,
    EmailStatsResponse,
)
from server.services import email_service
from server.services.parser import FileTooLargeError, UnsupportedFileFormatError

router = APIRouter()


@router.post("/text", response_model=EmailRead, status_code=status.HTTP_201_CREATED)
def ingest_email_text(
    payload: EmailCreateText,
    db: Session = Depends(get_db),
):
    return email_service.create_email_from_text(
        db=db,
        body=payload.body,
        subject=payload.subject,
    )


@router.post("/upload", response_model=EmailRead, status_code=status.HTTP_201_CREATED)
async def ingest_email_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename.",
        )

    content = await file.read()
    try:
        return email_service.create_email_from_upload(
            db=db,
            filename=file.filename,
            content=content,
        )
    except FileTooLargeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except UnsupportedFileFormatError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse and process email file: {str(e)}",
        )


@router.get("", response_model=EmailListResponse)
def list_emails(
    search: Optional[str] = Query(
        None, description="Search term for subject, body, or file_name"
    ),
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by status"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    items, total = email_service.list_emails(
        db=db,
        search=search,
        category=category,
        status=status_filter,
        skip=skip,
        limit=limit,
    )
    return EmailListResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/stats", response_model=EmailStatsResponse)
def get_email_stats(
    db: Session = Depends(get_db),
):
    stats = email_service.get_email_stats(db=db)
    return EmailStatsResponse(**stats)


@router.get("/{id}", response_model=EmailRead)
def get_email_by_id(
    id: str,
    db: Session = Depends(get_db),
):
    email_obj = email_service.get_email_by_id(db=db, email_id=id)
    if not email_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email with ID '{id}' not found.",
        )
    return email_obj


@router.patch("/{id}/override", response_model=EmailRead)
def override_email_category(
    id: str,
    payload: CategoryOverride,
    db: Session = Depends(get_db),
):
    try:
        updated_email = email_service.override_email_category(
            db=db,
            email_id=id,
            new_category=payload.category,
            reason=payload.reason,
        )
        if not updated_email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Email with ID '{id}' not found.",
            )
        return updated_email
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
