from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.core.database import get_db
from server.models.track import Track
from server.models.module import Module
from server.models.tutorial import Tutorial
from server.models.quiz import Quiz
from server.schemas.module import ModuleDetail
from server.schemas.tutorial import TutorialSummary

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("/{slug}", response_model=ModuleDetail)
def get_module_by_slug(slug: str, db: Session = Depends(get_db)):
    module = db.query(Module).filter(Module.slug == slug).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Module with slug '{slug}' not found",
        )

    track = db.query(Track).filter(Track.id == module.track_id).first()
    track_title = track.title if track else None

    tutorials = (
        db.query(Tutorial)
        .filter(Tutorial.module_id == module.id)
        .order_by(Tutorial.order_index.asc())
        .all()
    )
    tutorials_out = [TutorialSummary.model_validate(tut) for tut in tutorials]

    quiz = db.query(Quiz).filter(Quiz.module_id == module.id).first()
    quiz_id = quiz.id if quiz else None

    return ModuleDetail(
        id=module.id,
        track_id=module.track_id,
        title=module.title,
        slug=module.slug,
        summary=module.summary,
        difficulty=module.difficulty,
        estimated_minutes=module.estimated_minutes,
        prerequisites=module.prerequisites,
        order_index=module.order_index,
        track_title=track_title,
        tutorials=tutorials_out,
        quiz_id=quiz_id,
    )
