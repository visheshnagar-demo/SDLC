import uuid
from datetime import datetime
from typing import Optional, List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.models import Email, ClassificationAuditLog
from server.services.classifier import classify_email, VALID_CATEGORIES
from server.services.parser import parse_uploaded_file, parse_email_text, create_preview


def create_email_from_text(
    db: Session,
    body: str,
    subject: Optional[str] = None,
) -> Email:
    parsed_subject, parsed_body = parse_email_text(body, explicit_subject=subject)
    preview = create_preview(parsed_body, max_len=150)
    category, confidence_score = classify_email(parsed_subject or "", parsed_body)

    email_obj = Email(
        id=str(uuid.uuid4()),
        subject=parsed_subject or "Untitled Email",
        body=parsed_body,
        preview=preview,
        file_name=None,
        file_type="text",
        category=category,
        original_category=category,
        confidence_score=confidence_score,
        status="PROCESSED",
        is_overridden=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(email_obj)
    db.flush()

    audit = ClassificationAuditLog(
        id=str(uuid.uuid4()),
        email_id=email_obj.id,
        previous_category=None,
        new_category=category,
        action="INITIAL_CLASSIFICATION",
        reason="Automated AI text classification",
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()
    db.refresh(email_obj)
    return email_obj


def create_email_from_upload(
    db: Session,
    filename: str,
    content: bytes,
) -> Email:
    parsed_subject, parsed_body, file_type = parse_uploaded_file(filename, content)
    preview = create_preview(parsed_body, max_len=150)
    category, confidence_score = classify_email(parsed_subject or "", parsed_body)

    email_obj = Email(
        id=str(uuid.uuid4()),
        subject=parsed_subject or filename,
        body=parsed_body,
        preview=preview,
        file_name=filename,
        file_type=file_type,
        category=category,
        original_category=category,
        confidence_score=confidence_score,
        status="PROCESSED",
        is_overridden=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(email_obj)
    db.flush()

    audit = ClassificationAuditLog(
        id=str(uuid.uuid4()),
        email_id=email_obj.id,
        previous_category=None,
        new_category=category,
        action="INITIAL_CLASSIFICATION",
        reason=f"Automated AI file ingestion from {filename}",
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()
    db.refresh(email_obj)
    return email_obj


def list_emails(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[Email], int]:
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
                Email.file_name.ilike(search_pattern),
            )
        )

    total = query.count()
    items = query.order_by(Email.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_email_by_id(db: Session, email_id: str) -> Optional[Email]:
    return db.query(Email).filter(Email.id == email_id).first()


def override_email_category(
    db: Session,
    email_id: str,
    new_category: str,
    reason: Optional[str] = None,
) -> Optional[Email]:
    email_obj = get_email_by_id(db, email_id)
    if not email_obj:
        return None

    # Capitalize or normalize category if matched
    matched_cat = next(
        (c for c in VALID_CATEGORIES if c.lower() == new_category.lower()), None
    )
    if not matched_cat:
        raise ValueError(
            f"Invalid category '{new_category}'. Valid categories are: {', '.join(VALID_CATEGORIES)}"
        )

    previous_cat = email_obj.category
    email_obj.category = matched_cat
    email_obj.is_overridden = True
    email_obj.updated_at = datetime.utcnow()

    audit = ClassificationAuditLog(
        id=str(uuid.uuid4()),
        email_id=email_obj.id,
        previous_category=previous_cat,
        new_category=matched_cat,
        action="MANUAL_OVERRIDE",
        reason=reason or "Manual category override by user",
        created_at=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()
    db.refresh(email_obj)
    return email_obj


def get_email_stats(db: Session) -> Dict[str, int]:
    total = db.query(Email).count()
    urgent = db.query(Email).filter(Email.category == "Urgent").count()
    work = db.query(Email).filter(Email.category == "Work").count()
    personal = db.query(Email).filter(Email.category == "Personal").count()
    promotional = db.query(Email).filter(Email.category == "Promotional").count()
    uncategorized = db.query(Email).filter(Email.category == "Uncategorized").count()
    overridden = db.query(Email).filter(Email.is_overridden.is_(True)).count()

    return {
        "total": total,
        "urgent": urgent,
        "work": work,
        "personal": personal,
        "promotional": promotional,
        "uncategorized": uncategorized,
        "overridden": overridden,
    }
