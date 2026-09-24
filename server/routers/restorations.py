from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import RestorationCreate, RestorationResponse
from server.services.restoration_service import RestorationService

router = APIRouter(prefix="/api/v1/restorations", tags=["Restoration & Conservation"])


@router.get("", response_model=List[RestorationResponse])
def list_restorations(
    artifact_id: Optional[str] = Query(None, description="Filter treatments by artifact ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return RestorationService.get_restorations(
        db=db,
        artifact_id=artifact_id,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=RestorationResponse, status_code=status.HTTP_201_CREATED)
def create_restoration(
    restoration_in: RestorationCreate,
    db: Session = Depends(get_db)
):
    return RestorationService.create_restoration(db=db, restoration_in=restoration_in)


@router.get("/{id}", response_model=RestorationResponse)
def get_restoration(
    id: str,
    db: Session = Depends(get_db)
):
    return RestorationService.get_restoration_by_id(db=db, restoration_id=id)
