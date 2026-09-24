from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import User
from server.core.security import get_optional_user, require_admin_or_manager
from server.schemas import (
    JobCreate,
    JobUpdate,
    JobStatusUpdate,
    JobResponse,
    JobListResponse,
)
from server.services import job_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=JobListResponse)
def list_jobs(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Page size limit"),
    status: Optional[str] = Query(
        None, description="Filter by job status (draft, published, closed, archived)"
    ),
    department: Optional[str] = Query(None, description="Filter by department"),
    location: Optional[str] = Query(None, description="Filter by location"),
    employment_type: Optional[str] = Query(
        None, description="Filter by employment type"
    ),
    search: Optional[str] = Query(
        None, description="Free text search on title or description"
    ),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    items, total = job_service.list_jobs(
        db=db,
        skip=skip,
        limit=limit,
        status_filter=status,
        department=department,
        location=location,
        employment_type=employment_type,
        search=search,
        current_user=current_user,
    )
    return JobListResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )


@router.get("/{id}", response_model=JobResponse)
def get_job(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    return job_service.get_job_by_id(db=db, job_id=id, current_user=current_user)


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    return job_service.create_job(db=db, job_in=job_in, current_user=current_user)


@router.put("/{id}", response_model=JobResponse)
def update_job(
    id: str,
    job_in: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    return job_service.update_job(
        db=db, job_id=id, job_in=job_in, current_user=current_user
    )


@router.patch("/{id}/status", response_model=JobResponse)
def transition_job_status(
    id: str,
    status_in: JobStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    return job_service.transition_job_status(
        db=db, job_id=id, status_in=status_in, current_user=current_user
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    job_service.delete_job(db=db, job_id=id, current_user=current_user)
    return None
