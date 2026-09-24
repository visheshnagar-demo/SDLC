from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.models import Artifact, Location, RestorationRecord, MuseumLoan
from server.schemas import ArtifactCreate, ArtifactUpdate


class ArtifactService:
    @staticmethod
    def get_artifacts(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        location_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Artifact]:
        query = db.query(Artifact)
        if search:
            term = f"%{search}%"
            query = query.filter(
                (Artifact.title.ilike(term)) |
                (Artifact.accession_no.ilike(term)) |
                (Artifact.origin.ilike(term)) |
                (Artifact.medium.ilike(term)) |
                (Artifact.category.ilike(term))
            )
        if category and category != "All Categories":
            query = query.filter(Artifact.category == category)
        if status_filter and status_filter != "All Statuses":
            query = query.filter(Artifact.status == status_filter)
        if location_id and location_id != "All Locations":
            query = query.filter(Artifact.current_location_id == location_id)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_artifact_by_id(db: Session, artifact_id: str) -> Artifact:
        artifact = db.query(Artifact).filter(Artifact.id == artifact_id).first()
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Artifact with ID '{artifact_id}' not found."
            )
        return artifact

    @staticmethod
    def create_artifact(db: Session, artifact_in: ArtifactCreate) -> Artifact:
        # Check duplicate accession number
        existing = db.query(Artifact).filter(Artifact.accession_no == artifact_in.accession_no).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Artifact with accession number '{artifact_in.accession_no}' already exists."
            )

        # Check location exists
        location = db.query(Location).filter(Location.id == artifact_in.current_location_id).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Location with ID '{artifact_in.current_location_id}' does not exist."
            )

        artifact = Artifact(**artifact_in.model_dump())
        db.add(artifact)
        db.commit()
        db.refresh(artifact)
        return artifact

    @staticmethod
    def update_artifact(db: Session, artifact_id: str, artifact_in: ArtifactUpdate) -> Artifact:
        artifact = ArtifactService.get_artifact_by_id(db, artifact_id)
        update_data = artifact_in.model_dump(exclude_unset=True)

        if "current_location_id" in update_data and update_data["current_location_id"]:
            location = db.query(Location).filter(Location.id == update_data["current_location_id"]).first()
            if not location:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Location with ID '{update_data['current_location_id']}' does not exist."
                )

        for field, value in update_data.items():
            setattr(artifact, field, value)

        db.commit()
        db.refresh(artifact)
        return artifact

    @staticmethod
    def delete_artifact(db: Session, artifact_id: str) -> None:
        artifact = ArtifactService.get_artifact_by_id(db, artifact_id)

        # Check active loans
        active_loans = db.query(MuseumLoan).filter(
            MuseumLoan.artifact_id == artifact_id,
            MuseumLoan.loan_status.in_(["Requested", "Approved", "In Transit", "Active Loan"])
        ).count()
        if active_loans > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete artifact with active or in-transit loan agreements."
            )

        # Check restoration records
        restorations = db.query(RestorationRecord).filter(
            RestorationRecord.artifact_id == artifact_id
        ).count()
        if restorations > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete artifact with permanent conservation treatment history."
            )

        db.delete(artifact)
        db.commit()
