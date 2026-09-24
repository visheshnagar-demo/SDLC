from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.models import RestorationRecord, Artifact
from server.schemas import RestorationCreate


class RestorationService:
    @staticmethod
    def get_restorations(
        db: Session,
        artifact_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[RestorationRecord]:
        query = db.query(RestorationRecord).order_by(RestorationRecord.treatment_date.desc(), RestorationRecord.created_at.desc())
        if artifact_id:
            query = query.filter(RestorationRecord.artifact_id == artifact_id)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_restoration_by_id(db: Session, restoration_id: str) -> RestorationRecord:
        record = db.query(RestorationRecord).filter(RestorationRecord.id == restoration_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restoration record with ID '{restoration_id}' not found."
            )
        return record

    @staticmethod
    def create_restoration(db: Session, restoration_in: RestorationCreate) -> RestorationRecord:
        artifact = db.query(Artifact).filter(Artifact.id == restoration_in.artifact_id).first()
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target artifact with ID '{restoration_in.artifact_id}' not found."
            )

        restoration = RestorationRecord(**restoration_in.model_dump())
        # Automatically update the artifact's condition rating
        artifact.condition_rating = restoration_in.condition_after
        db.add(restoration)
        db.commit()
        db.refresh(restoration)
        return restoration
