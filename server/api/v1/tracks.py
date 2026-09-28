from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from server.core.database import get_db
from server.models.track import Track
from server.models.module import Module
from server.models.tutorial import Tutorial
from server.models.quiz import Quiz
from server.schemas.track import TrackSummary, TrackDetail
from server.schemas.module import ModuleSummary

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.get("", response_model=list[TrackSummary])
def list_tracks(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    published_only: bool = Query(True),
    db: Session = Depends(get_db),
):
    query = db.query(Track)
    if published_only:
        query = query.filter(Track.is_published.is_(True))
    if difficulty:
        query = query.filter(Track.difficulty.ilike(f"%{difficulty}%"))
    tracks = query.order_by(Track.order_index.asc()).offset(skip).limit(limit).all()

    result = []
    for t in tracks:
        module_count = db.query(Module).filter(Module.track_id == t.id).count()
        t_summary = TrackSummary(
            id=t.id,
            title=t.title,
            slug=t.slug,
            description=t.description,
            difficulty=t.difficulty,
            estimated_hours=t.estimated_hours,
            prerequisites=t.prerequisites,
            order_index=t.order_index,
            is_published=t.is_published,
            module_count=module_count,
            created_at=t.created_at,
        )
        result.append(t_summary)
    return result


@router.get("/{slug}", response_model=TrackDetail)
def get_track_by_slug(slug: str, db: Session = Depends(get_db)):
    track = db.query(Track).filter(Track.slug == slug).first()
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Track with slug '{slug}' not found",
        )

    modules_out = []
    modules = (
        db.query(Module)
        .filter(Module.track_id == track.id)
        .order_by(Module.order_index.asc())
        .all()
    )
    for m in modules:
        tut_count = db.query(Tutorial).filter(Tutorial.module_id == m.id).count()
        has_quiz = db.query(Quiz).filter(Quiz.module_id == m.id).first() is not None
        modules_out.append(
            ModuleSummary(
                id=m.id,
                track_id=m.track_id,
                title=m.title,
                slug=m.slug,
                summary=m.summary,
                difficulty=m.difficulty,
                estimated_minutes=m.estimated_minutes,
                prerequisites=m.prerequisites,
                order_index=m.order_index,
                tutorial_count=tut_count,
                has_quiz=has_quiz,
            )
        )

    return TrackDetail(
        id=track.id,
        title=track.title,
        slug=track.slug,
        description=track.description,
        difficulty=track.difficulty,
        estimated_hours=track.estimated_hours,
        prerequisites=track.prerequisites,
        order_index=track.order_index,
        is_published=track.is_published,
        modules=modules_out,
        created_at=track.created_at,
    )
