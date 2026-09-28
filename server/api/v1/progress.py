from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.core.database import get_db
from server.models.user import User
from server.models.track import Track
from server.models.module import Module
from server.models.progress import UserProgress
from server.schemas.progress import (
    UserProgressDashboard,
    TrackProgressOut,
    RecentModuleOut,
    ModuleTouchRequest,
)
from server.api.v1.auth import get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=UserProgressDashboard)
def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Total published modules
    tracks = db.query(Track).filter(Track.is_published.is_(True)).all()
    track_ids = [t.id for t in tracks]

    all_modules = (
        db.query(Module).filter(Module.track_id.in_(track_ids)).all()
        if track_ids
        else []
    )
    total_modules_count = len(all_modules)

    # User progress records
    user_records = (
        db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    )

    completed_records = [r for r in user_records if r.is_completed]
    completed_module_ids = [r.module_id for r in completed_records]
    completed_modules_count = len(completed_module_ids)

    overall_pct = (
        round((completed_modules_count / total_modules_count) * 100.0, 1)
        if total_modules_count > 0
        else 0.0
    )

    quizzes_passed_count = sum(
        1 for r in user_records if (r.quiz_score is not None and r.quiz_score >= 70)
    )

    # Recent module
    recent_record = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id)
        .order_by(UserProgress.last_accessed_at.desc())
        .first()
    )

    recent_module_out = None
    if recent_record:
        m = db.query(Module).filter(Module.id == recent_record.module_id).first()
        if m:
            trk = db.query(Track).filter(Track.id == m.track_id).first()
            recent_module_out = RecentModuleOut(
                id=m.id,
                title=m.title,
                slug=m.slug,
                track_title=trk.title if trk else "Track",
                last_accessed_at=recent_record.last_accessed_at,
            )

    # Track progress breakdown
    track_progress_list = []
    for t in tracks:
        t_modules = [m for m in all_modules if m.track_id == t.id]
        t_total = len(t_modules)
        t_completed = sum(1 for m in t_modules if m.id in completed_module_ids)
        t_pct = round((t_completed / t_total) * 100.0, 1) if t_total > 0 else 0.0
        track_progress_list.append(
            TrackProgressOut(
                track_id=t.id,
                title=t.title,
                slug=t.slug,
                total_modules=t_total,
                completed_modules=t_completed,
                completion_percentage=t_pct,
            )
        )

    return UserProgressDashboard(
        overall_completion_percentage=overall_pct,
        total_modules=total_modules_count,
        completed_modules=completed_modules_count,
        quizzes_passed=quizzes_passed_count,
        recent_module=recent_module_out,
        track_progress=track_progress_list,
        completed_module_ids=completed_module_ids,
    )


@router.post("/{module_id}/touch")
def touch_module_progress(
    module_id: str,
    touch_data: ModuleTouchRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Lookup module by id or slug
    module = (
        db.query(Module)
        .filter((Module.id == module_id) | (Module.slug == module_id))
        .first()
    )
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Module '{module_id}' not found",
        )

    progress = (
        db.query(UserProgress)
        .filter(
            UserProgress.user_id == current_user.id,
            UserProgress.module_id == module.id,
        )
        .first()
    )

    now = datetime.now(timezone.utc)
    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            module_id=module.id,
            is_completed=touch_data.is_completed
            if (touch_data and touch_data.is_completed is not None)
            else False,
            last_accessed_at=now,
        )
        db.add(progress)
    else:
        progress.last_accessed_at = now
        if touch_data and touch_data.is_completed is not None:
            progress.is_completed = touch_data.is_completed

    db.commit()
    db.refresh(progress)

    return {
        "status": "success",
        "module_id": module.id,
        "is_completed": progress.is_completed,
        "last_accessed_at": progress.last_accessed_at,
    }
