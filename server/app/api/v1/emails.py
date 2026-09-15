import asyncio
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from server.app.services.ai_classifier import classify_email_content_async
from server.app.services.email_parser import (
    parse_text_input,
    parse_uploaded_file,
)
from server.database import get_db
from server.models import Classification, Email
from server.schemas import (
    CategoryOverrideRequest,
    ClassificationResponse,
    EmailListResponse,
    EmailOverrideResponse,
    EmailResponse,
    MetricsResponse,
)

router = APIRouter(prefix="/emails", tags=["Emails"])


def build_excerpt(body_text: str, max_length: int = 160) -> str:
    cleaned = " ".join((body_text or "").split())
    if len(cleaned) <= max_length:
        return cleaned
    return cleaned[:max_length].rstrip() + "..."


def map_email_to_response(email_obj: Email) -> EmailResponse:
    class_resp = None
    if email_obj.classification:
        c = email_obj.classification
        primary = (
            c.user_override_category
            if c.is_overridden and c.user_override_category
            else c.ai_category
        )
        class_resp = ClassificationResponse(
            id=c.id,
            primary_category=primary,
            ai_category=c.ai_category,
            confidence_score=c.confidence_score,
            user_override_category=c.user_override_category,
            is_overridden=c.is_overridden,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )

    return EmailResponse(
        id=email_obj.id,
        sender=email_obj.sender,
        subject=email_obj.subject,
        excerpt=build_excerpt(email_obj.body_text),
        body_text=email_obj.body_text,
        source_type=email_obj.source_type,
        file_name=email_obj.file_name,
        classification=class_resp,
        created_at=email_obj.created_at,
        updated_at=email_obj.updated_at,
    )


@router.post(
    "/classify",
    response_model=EmailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Classify email content or file",
)
async def classify_email(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Accepts email text or uploaded file (.eml, .txt, .pdf), extracts headers and body,
    runs AI classification, stores in database, and returns classified email.
    """
    content_type = request.headers.get("content-type", "").lower()
    sender = None
    subject = None
    body_text = None
    source_type = "TEXT_ENTRY"
    file_name = None

    try:
        if (
            "multipart/form-data" in content_type
            or "application/x-www-form-urlencoded" in content_type
        ):
            form_data = await request.form()
            file_field = form_data.get("file")
            text_field = form_data.get("text")
            subject_field = form_data.get("subject")
            sender_field = form_data.get("sender")

            if (
                file_field is not None
                and hasattr(file_field, "filename")
                and file_field.filename
            ):
                file_name = file_field.filename
                source_type = "FILE_UPLOAD"
                file_bytes = await file_field.read()
                if not file_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Uploaded file is empty.",
                    )
                sender, subject, body_text = parse_uploaded_file(file_name, file_bytes)
            elif text_field:
                sender, subject, body_text = parse_text_input(
                    str(text_field),
                    subject=str(subject_field) if subject_field else None,
                    sender=str(sender_field) if sender_field else None,
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please provide either email text or upload a supported file (.eml, .txt, .pdf).",
                )
        else:
            # Assume JSON payload
            try:
                body_json = await request.json()
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid JSON payload.",
                )

            if (
                not body_json
                or not isinstance(body_json, dict)
                or "text" not in body_json
                or not str(body_json["text"]).strip()
            ):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Email text is required and cannot be empty.",
                )

            sender, subject, body_text = parse_text_input(
                text=str(body_json["text"]),
                subject=body_json.get("subject"),
                sender=body_json.get("sender"),
            )
            source_type = "TEXT_ENTRY"

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during email processing: {exc!s}",
        )

    # Perform AI classification with timeout protection
    try:
        (
            primary_category,
            confidence_score,
            all_scores,
        ) = await classify_email_content_async(
            body_text, subject or "", timeout_seconds=5.0
        )
    except (TimeoutError, asyncio.TimeoutError) as timeout_err:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(timeout_err),
        )
    except Exception as class_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI categorization engine error: {class_err!s}",
        )

    # Persist in database
    email_id = str(uuid.uuid4())
    email_record = Email(
        id=email_id,
        sender=sender,
        subject=subject,
        body_text=body_text,
        source_type=source_type,
        file_name=file_name,
    )
    db.add(email_record)

    classification_record = Classification(
        id=str(uuid.uuid4()),
        email_id=email_id,
        ai_category=primary_category,
        confidence_score=confidence_score,
        user_override_category=None,
        is_overridden=False,
    )
    db.add(classification_record)

    db.commit()
    db.refresh(email_record)

    response = map_email_to_response(email_record)
    if response.classification:
        response.classification.all_scores = all_scores
    return response


@router.get(
    "",
    response_model=EmailListResponse,
    summary="Get classified emails with filtering and search",
)
def get_classified_emails(
    category: str | None = Query(
        None, description="Filter by category (Work, Personal, Urgent, Promotional)"
    ),
    min_confidence: float | None = Query(
        None, ge=0.0, le=100.0, description="Filter by minimum confidence score"
    ),
    search: str | None = Query(
        None, description="Search keyword in subject, sender, or body"
    ),
    date_from: str | None = Query(None, description="Filter from ISO date"),
    date_to: str | None = Query(None, description="Filter to ISO date"),
    skip: int = Query(0, ge=0, description="Pagination skip"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    db: Session = Depends(get_db),
):
    query = db.query(Email).join(Email.classification)

    if category:
        cat_formatted = category.strip().capitalize()
        # Match either overridden category or ai category if not overridden
        query = query.filter(
            or_(
                and_(
                    Classification.is_overridden == True,
                    Classification.user_override_category == cat_formatted,
                ),
                and_(
                    Classification.is_overridden == False,
                    Classification.ai_category == cat_formatted,
                ),
                Classification.ai_category == cat_formatted,
            )
        )

    if min_confidence is not None:
        query = query.filter(Classification.confidence_score >= min_confidence)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Email.subject.ilike(term),
                Email.body_text.ilike(term),
                Email.sender.ilike(term),
            )
        )

    if date_from:
        try:
            d_from = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            query = query.filter(Email.created_at >= d_from)
        except ValueError:
            pass

    if date_to:
        try:
            d_to = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            query = query.filter(Email.created_at <= d_to)
        except ValueError:
            pass

    total = query.count()
    emails = query.order_by(Email.created_at.desc()).offset(skip).limit(limit).all()

    items = [map_email_to_response(e) for e in emails]
    return EmailListResponse(total=total, skip=skip, limit=limit, items=items)


@router.get(
    "/metrics",
    response_model=MetricsResponse,
    summary="Get aggregated email classification metrics",
)
def get_metrics(db: Session = Depends(get_db)):
    total = db.query(Email).count()
    classifications = db.query(Classification).all()

    work_count = 0
    personal_count = 0
    urgent_count = 0
    promotional_count = 0
    overridden_count = 0

    for c in classifications:
        effective_cat = (
            c.user_override_category
            if c.is_overridden and c.user_override_category
            else c.ai_category
        )
        if effective_cat == "Work":
            work_count += 1
        elif effective_cat == "Personal":
            personal_count += 1
        elif effective_cat == "Urgent":
            urgent_count += 1
        elif effective_cat == "Promotional":
            promotional_count += 1

        if c.is_overridden:
            overridden_count += 1

    return MetricsResponse(
        total_processed=total,
        work_count=work_count,
        personal_count=personal_count,
        urgent_count=urgent_count,
        promotional_count=promotional_count,
        overridden_count=overridden_count,
    )


@router.get(
    "/{email_id}",
    response_model=EmailResponse,
    summary="Get email details by ID",
)
def get_email_by_id(email_id: str, db: Session = Depends(get_db)):
    email_obj = db.query(Email).filter(Email.id == email_id).first()
    if not email_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email record '{email_id}' not found.",
        )
    return map_email_to_response(email_obj)


@router.patch(
    "/{email_id}",
    response_model=EmailOverrideResponse,
    summary="Override email category classification",
)
def override_classification(
    email_id: str,
    payload: CategoryOverrideRequest,
    db: Session = Depends(get_db),
):
    email_obj = db.query(Email).filter(Email.id == email_id).first()
    if not email_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email record '{email_id}' not found.",
        )

    classification = email_obj.classification
    if not classification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classification entry for this email was not found.",
        )

    classification.user_override_category = payload.category
    classification.is_overridden = True
    email_obj.updated_at = func.now()

    db.commit()
    db.refresh(classification)
    db.refresh(email_obj)

    class_resp = ClassificationResponse(
        id=classification.id,
        primary_category=classification.user_override_category,
        ai_category=classification.ai_category,
        confidence_score=classification.confidence_score,
        user_override_category=classification.user_override_category,
        is_overridden=True,
        created_at=classification.created_at,
        updated_at=classification.updated_at,
    )

    return EmailOverrideResponse(
        id=email_obj.id,
        classification=class_resp,
        updated_at=email_obj.updated_at,
    )


@router.delete(
    "/{email_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete email and associated classification",
)
def delete_email(email_id: str, db: Session = Depends(get_db)):
    email_obj = db.query(Email).filter(Email.id == email_id).first()
    if not email_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email record '{email_id}' not found.",
        )
    db.delete(email_obj)
    db.commit()
