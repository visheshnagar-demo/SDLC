from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.core.database import get_db
from server.models.user import User
from server.models.tutorial import Tutorial
from server.models.bookmark import Bookmark
from server.schemas.bookmark import BookmarkOut, BookmarkToggleResponse
from server.schemas.tutorial import TutorialSummary
from server.api.v1.auth import get_current_user

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("", response_model=list[BookmarkOut])
def list_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmarks = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )

    result = []
    for bm in bookmarks:
        tut = db.query(Tutorial).filter(Tutorial.id == bm.tutorial_id).first()
        tut_summary = TutorialSummary.model_validate(tut) if tut else None
        result.append(
            BookmarkOut(
                id=bm.id,
                user_id=bm.user_id,
                tutorial_id=bm.tutorial_id,
                created_at=bm.created_at,
                tutorial=tut_summary,
            )
        )
    return result


@router.post("/{tutorial_id}", response_model=BookmarkToggleResponse)
def toggle_or_add_bookmark(
    tutorial_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Lookup tutorial by id or slug
    tutorial = (
        db.query(Tutorial)
        .filter((Tutorial.id == tutorial_id) | (Tutorial.slug == tutorial_id))
        .first()
    )
    if not tutorial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tutorial '{tutorial_id}' not found",
        )

    existing = (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == current_user.id,
            Bookmark.tutorial_id == tutorial.id,
        )
        .first()
    )

    if existing:
        return BookmarkToggleResponse(
            bookmarked=True,
            message="Tutorial already bookmarked",
            bookmark=BookmarkOut(
                id=existing.id,
                user_id=existing.user_id,
                tutorial_id=existing.tutorial_id,
                created_at=existing.created_at,
                tutorial=TutorialSummary.model_validate(tutorial),
            ),
        )

    new_bm = Bookmark(
        user_id=current_user.id,
        tutorial_id=tutorial.id,
    )
    db.add(new_bm)
    db.commit()
    db.refresh(new_bm)

    return BookmarkToggleResponse(
        bookmarked=True,
        message="Tutorial bookmarked successfully",
        bookmark=BookmarkOut(
            id=new_bm.id,
            user_id=new_bm.user_id,
            tutorial_id=new_bm.tutorial_id,
            created_at=new_bm.created_at,
            tutorial=TutorialSummary.model_validate(tutorial),
        ),
    )


@router.delete("/{tutorial_id}")
def remove_bookmark(
    tutorial_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Lookup tutorial by id or slug
    tutorial = (
        db.query(Tutorial)
        .filter((Tutorial.id == tutorial_id) | (Tutorial.slug == tutorial_id))
        .first()
    )
    target_tut_id = tutorial.id if tutorial else tutorial_id

    bookmark = (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == current_user.id,
            Bookmark.tutorial_id == target_tut_id,
        )
        .first()
    )

    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found",
        )

    db.delete(bookmark)
    db.commit()
    return {"detail": "Bookmark removed successfully"}
