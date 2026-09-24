from datetime import date, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.models import Inspection, Artifact
from server.schemas import InspectionCreate, InspectionComplete


class InspectionService:
    @staticmethod
    def get_inspections(
        db: Session,
        status_filter: Optional[str] = None,
        artifact_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Inspection]:
        today = date.today()
        # Automatically update any past-due Scheduled inspections to Overdue
        scheduled_past = db.query(Inspection).filter(
            Inspection.inspection_status == "Scheduled",
            Inspection.scheduled_date < today
        ).all()
        for item in scheduled_past:
            item.inspection_status = "Overdue"
        if scheduled_past:
            db.commit()

        query = db.query(Inspection).order_by(Inspection.scheduled_date.asc())
        if artifact_id:
            query = query.filter(Inspection.artifact_id == artifact_id)
        if status_filter:
            query = query.filter(Inspection.inspection_status == status_filter)

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_inspection_by_id(db: Session, inspection_id: str) -> Inspection:
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspection with ID '{inspection_id}' not found."
            )
        return inspection

    @staticmethod
    def schedule_inspection(db: Session, inspection_in: InspectionCreate) -> Inspection:
        artifact = db.query(Artifact).filter(Artifact.id == inspection_in.artifact_id).first()
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Artifact with ID '{inspection_in.artifact_id}' not found."
            )

        status_val = inspection_in.inspection_status or "Scheduled"
        if status_val == "Scheduled" and inspection_in.scheduled_date < date.today():
            status_val = "Overdue"

        inspection = Inspection(
            artifact_id=inspection_in.artifact_id,
            assigned_inspector=inspection_in.assigned_inspector,
            scheduled_date=inspection_in.scheduled_date,
            inspection_status=status_val,
            findings_notes=inspection_in.findings_notes
        )
        db.add(inspection)
        db.commit()
        db.refresh(inspection)
        return inspection

    @staticmethod
    def complete_inspection(db: Session, inspection_id: str, complete_in: InspectionComplete) -> Inspection:
        inspection = InspectionService.get_inspection_by_id(db, inspection_id)

        completed_dt = complete_in.completed_date or date.today()
        inspection.completed_date = completed_dt
        inspection.inspection_status = "Completed"
        inspection.surface_condition = complete_in.surface_condition
        inspection.pest_activity = complete_in.pest_activity
        inspection.structural_integrity = complete_in.structural_integrity
        inspection.findings_notes = complete_in.findings_notes

        # Calculate next recommended inspection date if not provided
        if complete_in.next_recommended_inspection_date:
            inspection.next_recommended_inspection_date = complete_in.next_recommended_inspection_date
        else:
            # Risk calculation:
            if complete_in.pest_activity or complete_in.structural_integrity == "Compromised" or complete_in.surface_condition in ["Severe Flaking", "Severe Flaking/Fraying"]:
                # High risk
                inspection.next_recommended_inspection_date = completed_dt + timedelta(days=30)
            elif complete_in.structural_integrity == "Fragile" or complete_in.surface_condition in ["Minor Wear", "Abrasion"]:
                # Medium risk
                inspection.next_recommended_inspection_date = completed_dt + timedelta(days=90)
            else:
                # Normal / Sound
                inspection.next_recommended_inspection_date = completed_dt + timedelta(days=180)

        db.commit()
        db.refresh(inspection)
        return inspection
