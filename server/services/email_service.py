import os
import uuid
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from server.models import Email, ClassificationAuditLog
from server.schemas import EmailCreateText
from server.services.parser import (
    validate_file_size_and_extension,
    parse_eml,
    parse_msg,
    parse_txt,
    generate_preview,
)
from server.services.classifier import classify_email


def create_email_from_text(db: Session, email_in: EmailCreateText) -> Email:
    """Create, ingest with PENDING status, and classify an email from raw text input."""
    subject = (email_in.subject or "").strip() or None
    body = email_in.body.strip()
    preview = generate_preview(body or (subject or ""))

    # Stage 1: Initialize record in PENDING status
    email_obj = Email(
        id=str(uuid.uuid4()),
        subject=subject,
        body=body,
        preview=preview,
        file_name=None,
        file_type="raw_text",
        category="Uncategorized",
        original_category="Uncategorized",
        confidence_score=0.0,
        status="PENDING",
        is_overridden=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(email_obj)
    db.flush()

    try:
        # Stage 2: AI Classification & Processing
        category, confidence_score = classify_email(subject, body)
        email_obj.category = category
        email_obj.original_category = category
        email_obj.confidence_score = confidence_score
        email_obj.status = "PROCESSED"
    except Exception:
        email_obj.status = "FAILED"
        email_obj.category = "Uncategorized"
        email_obj.original_category = "Uncategorized"
        email_obj.confidence_score = 0.0

    db.commit()
    db.refresh(email_obj)
    return email_obj


def create_email_from_file(db: Session, filename: str, file_bytes: bytes) -> Email:
    """Validate, initialize PENDING record, parse, and classify an uploaded email file."""
    file_size = len(file_bytes)
    validate_file_size_and_extension(filename, file_size)

    ext = os.path.splitext(filename)[1].lower()

    # Stage 1: Initialize record in PENDING status
    email_obj = Email(
        id=str(uuid.uuid4()),
        subject=None,
        body="",
        preview="",
        file_name=filename,
        file_type=ext,
        category="Uncategorized",
        original_category="Uncategorized",
        confidence_score=0.0,
        status="PENDING",
        is_overridden=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(email_obj)
    db.flush()

    try:
        if ext == ".eml":
            subject, body = parse_eml(file_bytes)
        elif ext == ".msg":
            subject, body = parse_msg(file_bytes)
        elif ext == ".txt":
            subject, body = parse_txt(file_bytes)
        else:
            subject, body = None, file_bytes.decode("utf-8", errors="replace")

        preview = generate_preview(body or (subject or ""))
        category, confidence_score = classify_email(subject, body)

        email_obj.subject = subject
        email_obj.body = body
        email_obj.preview = preview
        email_obj.category = category
        email_obj.original_category = category
        email_obj.confidence_score = confidence_score
        email_obj.status = "PROCESSED"
    except Exception:
        email_obj.status = "FAILED"
        email_obj.category = "Uncategorized"
        email_obj.original_category = "Uncategorized"
        email_obj.confidence_score = 0.0

    db.commit()
    db.refresh(email_obj)
    return email_obj


def list_emails(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> Tuple[int, List[Email]]:
    """List emails with filtering, search, and pagination."""
    query = db.query(Email)

    if category and category.lower() != "all":
        query = query.filter(Email.category.ilike(category))

    if status and status.lower() != "all":
        query = query.filter(Email.status.ilike(status))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Email.subject.ilike(search_pattern),
                Email.body.ilike(search_pattern),
                Email.preview.ilike(search_pattern),
                Email.file_name.ilike(search_pattern),
            )
        )

    total = query.count()
    items = query.order_by(desc(Email.created_at)).offset(skip).limit(limit).all()
    return total, items


def get_email_by_id(db: Session, email_id: str) -> Optional[Email]:
    """Retrieve an email record by its primary key UUID."""
    return db.query(Email).filter(Email.id == email_id).first()


def override_category(
    db: Session, email_id: str, new_category: str, modified_by: str = "user"
) -> Optional[Email]:
    """Manually override the classification category of an email and record an audit log."""
    email_obj = get_email_by_id(db, email_id)
    if not email_obj:
        return None

    previous_category = email_obj.category

    # Create audit log
    audit_log = ClassificationAuditLog(
        id=str(uuid.uuid4()),
        email_id=email_obj.id,
        previous_category=previous_category,
        new_category=new_category,
        modified_by=modified_by,
        created_at=datetime.utcnow(),
    )
    db.add(audit_log)

    # Update email record
    email_obj.category = new_category
    email_obj.is_overridden = True
    email_obj.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(email_obj)
    return email_obj
