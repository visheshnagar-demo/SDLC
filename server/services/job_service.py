import json
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from server.models import Job, JobAuditLog, User
from server.schemas import JobCreate, JobUpdate, JobStatusUpdate


def _job_to_dict(job: Job) -> dict:
    return {
        "id": str(job.id),
        "title": str(job.title),
        "description": str(job.description),
        "department": str(job.department),
        "location": str(job.location),
        "employment_type": str(job.employment_type),
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "currency": str(job.currency),
        "status": str(job.status),
        "created_by": str(job.created_by) if job.created_by else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    }


def list_jobs(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    employment_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = None,
) -> Tuple[List[Job], int]:
    query = db.query(Job)

    # RBAC filtering on list endpoint
    is_admin_or_manager = bool(
        current_user and current_user.role.lower() in ["admin", "manager"]
    )

    if not is_admin_or_manager:
        query = query.filter(Job.status == "published")
    elif status_filter:
        query = query.filter(Job.status == status_filter.lower())

    if department:
        query = query.filter(Job.department.ilike(f"%{department}%"))

    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))

    if employment_type:
        query = query.filter(Job.employment_type.ilike(f"%{employment_type}%"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Job.title.ilike(search_pattern),
                Job.description.ilike(search_pattern),
            )
        )

    total = query.count()
    items = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_job_by_id(db: Session, job_id: str, current_user: Optional[User] = None) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found.",
        )

    is_admin_or_manager = bool(
        current_user and current_user.role.lower() in ["admin", "manager"]
    )
    if not is_admin_or_manager and str(job.status) != "published":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found.",
        )

    return job


def create_job(db: Session, job_in: JobCreate, current_user: User) -> Job:
    job = Job(
        title=job_in.title.strip(),
        description=job_in.description.strip(),
        department=job_in.department.strip(),
        location=job_in.location.strip(),
        employment_type=job_in.employment_type.strip(),
        salary_min=job_in.salary_min,
        salary_max=job_in.salary_max,
        currency=job_in.currency.upper() if job_in.currency else "USD",
        status=job_in.status.lower() if job_in.status else "draft",
        created_by=str(current_user.email),
    )
    db.add(job)
    db.flush()

    audit_log = JobAuditLog(
        job_id=str(job.id),
        action="CREATED",
        previous_state=None,
        new_state=json.dumps(_job_to_dict(job)),
        performed_by=str(current_user.email),
    )
    db.add(audit_log)
    db.commit()
    db.refresh(job)
    return job


def validate_status_transition(
    current_status: str, target_status: str, current_user: User
):
    current_status = current_status.lower()
    target_status = target_status.lower()

    if current_status == target_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job is already in '{target_status}' status.",
        )

    valid_statuses = {"draft", "published", "closed", "archived"}
    if target_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target status '{target_status}'. Must be one of {list(valid_statuses)}",
        )

    is_admin = bool(current_user and current_user.role.lower() == "admin")

    # State Machine Rules
    if current_status == "closed" and target_status == "draft":
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot transition job from 'closed' to 'draft' without admin override.",
            )

    if current_status == "archived" and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify or restore an archived job without admin override.",
        )


def update_job(db: Session, job_id: str, job_in: JobUpdate, current_user: User) -> Job:
    job = get_job_by_id(db, job_id, current_user=current_user)
    prev_state = _job_to_dict(job)

    current_status = str(job.status)
    current_salary_min = job.salary_min
    current_salary_max = job.salary_max

    new_min = job_in.salary_min if job_in.salary_min is not None else current_salary_min
    new_max = job_in.salary_max if job_in.salary_max is not None else current_salary_max

    if new_min is not None and new_min < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum salary cannot be negative",
        )
    if new_max is not None and new_max < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Maximum salary cannot be negative",
        )
    if new_min is not None and new_max is not None and new_min > new_max:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum salary cannot exceed maximum salary",
        )

    if job_in.status and job_in.status.lower() != current_status:
        validate_status_transition(current_status, job_in.status.lower(), current_user)
        job.status = job_in.status.lower()

    if job_in.title is not None:
        job.title = job_in.title.strip()
    if job_in.description is not None:
        job.description = job_in.description.strip()
    if job_in.department is not None:
        job.department = job_in.department.strip()
    if job_in.location is not None:
        job.location = job_in.location.strip()
    if job_in.employment_type is not None:
        job.employment_type = job_in.employment_type.strip()
    if job_in.salary_min is not None:
        job.salary_min = job_in.salary_min
    if job_in.salary_max is not None:
        job.salary_max = job_in.salary_max
    if job_in.currency is not None:
        job.currency = job_in.currency.upper()

    audit_log = JobAuditLog(
        job_id=str(job.id),
        action="UPDATED",
        previous_state=json.dumps(prev_state),
        new_state=json.dumps(_job_to_dict(job)),
        performed_by=str(current_user.email),
    )
    db.add(audit_log)
    db.commit()
    db.refresh(job)
    return job


def transition_job_status(
    db: Session, job_id: str, status_in: JobStatusUpdate, current_user: User
) -> Job:
    job = get_job_by_id(db, job_id, current_user=current_user)
    target_status = status_in.status.lower()
    prev_state = _job_to_dict(job)

    validate_status_transition(str(job.status), target_status, current_user)

    job.status = target_status
    audit_log = JobAuditLog(
        job_id=str(job.id),
        action="STATUS_CHANGED",
        previous_state=json.dumps(prev_state),
        new_state=json.dumps(_job_to_dict(job)),
        performed_by=str(current_user.email),
    )
    db.add(audit_log)
    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, job_id: str, current_user: User) -> None:
    job = get_job_by_id(db, job_id, current_user=current_user)
    prev_state = _job_to_dict(job)

    audit_log = JobAuditLog(
        job_id=str(job.id),
        action="DELETED",
        previous_state=json.dumps(prev_state),
        new_state=None,
        performed_by=str(current_user.email),
    )
    db.add(audit_log)
    db.delete(job)
    db.commit()
