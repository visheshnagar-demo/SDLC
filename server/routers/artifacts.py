from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import (
    ArtifactCreate,
    ArtifactUpdate,
    ArtifactResponse,
    ArtifactDetailResponse
)
from server.services.artifact_service import ArtifactService

router = APIRouter(prefix="/api/v1/artifacts", tags=["Artifacts"])


@router.get("", response_model=List[ArtifactResponse])
def list_artifacts(
    q: Optional[str] = Query(None, description="Search term for accession number, title, origin, medium"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    location_id: Optional[str] = Query(None, description="Filter by location ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return ArtifactService.get_artifacts(
        db=db,
        search=q,
        category=category,
        status_filter=status,
        location_id=location_id,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=ArtifactResponse, status_code=status.HTTP_201_CREATED)
def create_artifact(
    artifact_in: ArtifactCreate,
    db: Session = Depends(get_db)
):
    return ArtifactService.create_artifact(db=db, artifact_in=artifact_in)


@router.get("/{id}", response_model=ArtifactDetailResponse)
def get_artifact(
    id: str,
    db: Session = Depends(get_db)
):
    return ArtifactService.get_artifact_by_id(db=db, artifact_id=id)


@router.put("/{id}", response_model=ArtifactResponse)
def update_artifact(
    id: str,
    artifact_in: ArtifactUpdate,
    db: Session = Depends(get_db)
):
    return ArtifactService.update_artifact(db=db, artifact_id=id, artifact_in=artifact_in)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_artifact(
    id: str,
    db: Session = Depends(get_db)
):
    ArtifactService.delete_artifact(db=db, artifact_id=id)
    return None
