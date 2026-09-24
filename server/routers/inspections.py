from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import (
    InspectionCreate,
    InspectionComplete,
    InspectionResponse
)
from server.services.inspection_service import InspectionService

router = APIRouter(prefix="/api/v1/inspections", tags=["Inspections"])


@router.get("", response_model=List[InspectionResponse])
def list_inspections(
    status: Optional[str] = Query(None, description="Filter by status (Scheduled, Completed, Overdue, Cancelled)"),
    artifact_id: Optional[str] = Query(None, description="Filter by artifact ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return InspectionService.get_inspections(
        db=db,
        status_filter=status,
        artifact_id=artifact_id,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def schedule_inspection(
    inspection_in: InspectionCreate,
    db: Session = Depends(get_db)
):
    return InspectionService.schedule_inspection(db=db, inspection_in=inspection_in)


@router.get("/{id}", response_model=InspectionResponse)
def get_inspection(
    id: str,
    db: Session = Depends(get_db)
):
    return InspectionService.get_inspection_by_id(db=db, inspection_id=id)


@router.put("/{id}/complete", response_model=InspectionResponse)
def complete_inspection(
    id: str,
    complete_in: InspectionComplete,
    db: Session = Depends(get_db)
):
    return InspectionService.complete_inspection(db=db, inspection_id=id, complete_in=complete_in)
