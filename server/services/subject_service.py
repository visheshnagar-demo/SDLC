"""Business logic service for managing Subjects."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from server.models.subject import Subject
from server.schemas.subject import SubjectCreate, SubjectUpdate


class SubjectService:
    @staticmethod
    def get_all_subjects(db: Session, skip: int = 0, limit: int = 100) -> List[Subject]:
        return db.query(Subject).offset(skip).limit(limit).all()

    @staticmethod
    def get_subject_by_id(db: Session, subject_id: str) -> Optional[Subject]:
        return db.query(Subject).filter(Subject.id == subject_id).first()

    @staticmethod
    def create_subject(db: Session, data: SubjectCreate) -> Subject:
        now = datetime.now(timezone.utc)
        subject = Subject(
            id=str(uuid.uuid4()),
            name=data.name,
            difficulty_level=data.difficulty_level,
            target_date=data.target_date,
            estimated_total_hours=data.estimated_total_hours,
            color_tag=data.color_tag,
            created_at=now,
            updated_at=now,
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
        return subject

    @staticmethod
    def update_subject(
        db: Session, subject_id: str, data: SubjectUpdate
    ) -> Optional[Subject]:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(subject, key, value)

        setattr(subject, "updated_at", datetime.now(timezone.utc))
        db.commit()
        db.refresh(subject)
        return subject

    @staticmethod
    def delete_subject(db: Session, subject_id: str) -> bool:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            return False
        db.delete(subject)
        db.commit()
        return True
