"""Router for Subject management endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from server.services.subject_service import SubjectService

router = APIRouter(prefix="/api/v1/subjects", tags=["Subjects"])


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    """Create a new study subject with difficulty rating and target completion date."""
    return SubjectService.create_subject(db, data)


@router.get("", response_model=List[SubjectResponse], status_code=status.HTTP_200_OK)
def list_subjects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all configured study subjects."""
    return SubjectService.get_all_subjects(db, skip=skip, limit=limit)


@router.get(
    "/{subject_id}", response_model=SubjectResponse, status_code=status.HTTP_200_OK
)
def get_subject(subject_id: str, db: Session = Depends(get_db)):
    """Retrieve a single subject by ID."""
    subject = SubjectService.get_subject_by_id(db, subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found",
        )
    return subject


@router.put(
    "/{subject_id}", response_model=SubjectResponse, status_code=status.HTTP_200_OK
)
def update_subject(subject_id: str, data: SubjectUpdate, db: Session = Depends(get_db)):
    """Update subject properties."""
    subject = SubjectService.update_subject(db, subject_id, data)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found",
        )
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: str, db: Session = Depends(get_db)):
    """Delete a subject by ID."""
    success = SubjectService.delete_subject(db, subject_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found",
        )
    return None
