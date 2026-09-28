from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.core.database import get_db
from server.models.track import Track
from server.models.module import Module
from server.models.tutorial import Tutorial
from server.models.quiz import Quiz
from server.schemas.tutorial import TutorialDetail, TutorialSearchResult

router = APIRouter(prefix="/tutorials", tags=["tutorials"])


@router.get("/search", response_model=list[TutorialSearchResult])
def search_tutorials(
    q: Optional[str] = Query(
        None, description="Search term for title, content, or tags"
    ),
    category: Optional[str] = Query(None, description="Filter by track/category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    framework: Optional[str] = Query(
        None, description="Filter by framework (e.g. pytorch, numpy)"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Tutorial)
        .join(Module, Tutorial.module_id == Module.id)
        .join(Track, Module.track_id == Track.id)
    )

    if q:
        search_terms = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Tutorial.title.ilike(search_terms),
                Tutorial.content_markdown.ilike(search_terms),
                Tutorial.tags.ilike(search_terms),
                Tutorial.math_formulas.ilike(search_terms),
                Module.title.ilike(search_terms),
                Track.title.ilike(search_terms),
            )
        )

    if category:
        query = query.filter(
            or_(
                Track.title.ilike(f"%{category}%"),
                Track.slug.ilike(f"%{category}%"),
            )
        )

    if difficulty:
        query = query.filter(
            or_(
                Module.difficulty.ilike(f"%{difficulty}%"),
                Track.difficulty.ilike(f"%{difficulty}%"),
            )
        )

    if framework:
        query = query.filter(
            or_(
                Tutorial.tags.ilike(f"%{framework}%"),
                Tutorial.content_markdown.ilike(f"%{framework}%"),
            )
        )

    tutorials = query.offset(skip).limit(limit).all()

    results = []
    for tut in tutorials:
        mod = tut.module
        trk = mod.track if mod else None

        # Build snippet from markdown
        snippet_text = tut.content_markdown[:200].replace("\n", " ").strip()
        if len(tut.content_markdown) > 200:
            snippet_text += "..."

        results.append(
            TutorialSearchResult(
                id=tut.id,
                title=tut.title,
                slug=tut.slug,
                module_id=tut.module_id,
                module_title=mod.title if mod else "Unknown Module",
                track_title=trk.title if trk else "Unknown Track",
                snippet=snippet_text,
                tags=tut.tags,
                difficulty=mod.difficulty if mod else None,
            )
        )
    return results


@router.get("/{slug}", response_model=TutorialDetail)
def get_tutorial_by_slug(slug: str, db: Session = Depends(get_db)):
    tutorial = db.query(Tutorial).filter(Tutorial.slug == slug).first()
    if not tutorial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tutorial with slug '{slug}' not found",
        )

    # Find siblings in the same module
    sibling_tutorials = (
        db.query(Tutorial)
        .filter(Tutorial.module_id == tutorial.module_id)
        .order_by(Tutorial.order_index.asc())
        .all()
    )

    prev_slug = None
    next_slug = None
    for idx, sib in enumerate(sibling_tutorials):
        if sib.id == tutorial.id:
            if idx > 0:
                prev_slug = sibling_tutorials[idx - 1].slug
            if idx < len(sibling_tutorials) - 1:
                next_slug = sibling_tutorials[idx + 1].slug
            break

    quiz = db.query(Quiz).filter(Quiz.module_id == tutorial.module_id).first()
    quiz_id = quiz.id if quiz else None

    return TutorialDetail(
        id=tutorial.id,
        module_id=tutorial.module_id,
        title=tutorial.title,
        slug=tutorial.slug,
        content_markdown=tutorial.content_markdown,
        math_formulas=tutorial.math_formulas,
        code_snippets=tutorial.code_snippets or [],
        tags=tutorial.tags,
        order_index=tutorial.order_index,
        next_tutorial_slug=next_slug,
        prev_tutorial_slug=prev_slug,
        quiz_id=quiz_id,
    )
