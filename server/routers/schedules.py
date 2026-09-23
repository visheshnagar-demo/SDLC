"""Router for Study Schedule and Priority Generation endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.subject import Subject
from server.schemas.schedule import (
    ScheduleGenerateRequest,
    StudyPlanResponse,
    StudyPlanDetailResponse,
    StudySessionResponse,
    SessionStatusUpdate,
    PrioritySummary,
)
from server.services.schedule_service import ScheduleService

router = APIRouter(prefix="/api/v1/schedules", tags=["Schedules"])


@router.post(
    "/generate", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED
)
def generate_schedule(payload: ScheduleGenerateRequest, db: Session = Depends(get_db)):
    """Generate an AI-powered personalized study schedule and priority matrix."""
    try:
        plan = ScheduleService.generate_and_save_schedule(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Construct response with priority summaries and session counts
    subject_map = {s.id: s.name for s in db.query(Subject).all()}
    priority_summaries = []
    for p in plan.priorities:
        subj_name = subject_map.get(p.subject_id, "Unknown Subject")
        # Calculate approximate allocated hours from sessions
        allocated_mins = sum(
            sess.duration_minutes
            for sess in plan.sessions
            if sess.subject_id == p.subject_id
        )
        allocated_hrs = round(allocated_mins / 60.0, 1)
        priority_summaries.append(
            PrioritySummary(
                subject_name=subj_name,
                priority_rank=p.priority_rank,
                allocated_hours=allocated_hrs,
                recommendation_text=p.recommendation_text,
            )
        )

    return StudyPlanResponse(
        id=plan.id,
        title=plan.title,
        start_date=plan.start_date,
        end_date=plan.end_date,
        total_study_hours=plan.total_study_hours,
        status=plan.status,
        sessions_count=len(plan.sessions),
        priorities=priority_summaries,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    )


@router.get(
    "", response_model=List[StudyPlanDetailResponse], status_code=status.HTTP_200_OK
)
def list_schedules(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """List all created study plans."""
    return ScheduleService.get_all_schedules(db, skip=skip, limit=limit)


@router.get(
    "/{plan_id}", response_model=StudyPlanDetailResponse, status_code=status.HTTP_200_OK
)
def get_schedule(plan_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed schedule breakdown with individual daily sessions and recommendations."""
    plan = ScheduleService.get_schedule_by_id(db, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study Plan with ID {plan_id} not found",
        )
    return plan


@router.patch(
    "/sessions/{session_id}",
    response_model=StudySessionResponse,
    status_code=status.HTTP_200_OK,
)
def update_session_status(
    session_id: str, payload: SessionStatusUpdate, db: Session = Depends(get_db)
):
    """Update study session status (e.g., COMPLETED, SKIPPED, RESCHEDULED, PENDING)."""
    session = ScheduleService.update_session_status(
        db, session_id, payload.status.upper()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study session with ID {session_id} not found",
        )
    return session


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(plan_id: str, db: Session = Depends(get_db)):
    """Delete a study plan and all associated sessions."""
    success = ScheduleService.delete_schedule(db, plan_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study Plan with ID {plan_id} not found",
        )
    return None
