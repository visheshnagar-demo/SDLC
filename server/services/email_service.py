import uuid
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.models import Email, ClassificationAuditLog
from server.services.classifier import classify_email, CATEGORIES
from server.services.parser import parse_email_file, extract_preview


def create_email_from_text(
    db: Session, body: str, subject: Optional[str] = None
) -> Email:
    category, confidence = classify_email(body, subject or "")
    preview = extract_preview(body)

    email_obj = Email(
        id=str(uuid.uuid4()),
        subject=subject,
        body=body,
        preview=preview,
        file_name=None,
        file_type=None,
        category=category,
        original_category=category,
        confidence_score=confidence,
        status="PROCESSED",
        is_overridden=False,
    )
    db.add(email_obj)
    db.commit()
    db.refresh(email_obj)
    return email_obj


def create_email_from_file(db: Session, content: bytes, filename: str) -> Email:
    subject, body, ext = parse_email_file(content, filename)
    category, confidence = classify_email(body, subject or "")
    preview = extract_preview(body)

    email_obj = Email(
        id=str(uuid.uuid4()),
        subject=subject,
        body=body,
        preview=preview,
        file_name=filename,
        file_type=ext,
        category=category,
        original_category=category,
        confidence_score=confidence,
        status="PROCESSED",
        is_overridden=False,
    )
    db.add(email_obj)
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
) -> Tuple[List[Email], int]:
    query = db.query(Email)

    if category and category.lower() != "all":
        query = query.filter(Email.category == category)

    if status and status.lower() != "all":
        query = query.filter(Email.status == status)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Email.subject.ilike(search_term),
                Email.body.ilike(search_term),
                Email.file_name.ilike(search_term),
            )
        )

    total = query.count()
    items = query.order_by(Email.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_email_by_id(db: Session, email_id: str) -> Optional[Email]:
    return db.query(Email).filter(Email.id == email_id).first()


def override_email_category(
    db: Session, email_id: str, new_category: str, reason: Optional[str] = None
) -> Optional[Email]:
    if new_category not in CATEGORIES:
        raise ValueError(
            f"Invalid category '{new_category}'. Allowed categories: {', '.join(CATEGORIES)}"
        )

    email_obj = get_email_by_id(db, email_id)
    if not email_obj:
        return None

    audit_log = ClassificationAuditLog(
        id=str(uuid.uuid4()),
        email_id=email_obj.id,
        previous_category=str(email_obj.category),
        new_category=new_category,
        reason=reason,
    )
    db.add(audit_log)

    email_obj.category = new_category
    email_obj.is_overridden = True
    db.commit()
    db.refresh(email_obj)
    return email_obj
