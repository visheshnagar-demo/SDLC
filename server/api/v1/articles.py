import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import Article, User
from server.schemas import (
    ArticleCreate,
    ArticleUpdate,
    ArticleStatusUpdate,
    ArticleResponse,
)
from server.auth import get_current_user, require_roles

router = APIRouter(prefix="/articles", tags=["Articles"])


@router.get("", response_model=List[ArticleResponse])
def list_articles(
    status_filter: Optional[str] = Query(None, alias="status"),
    channel_id: Optional[str] = Query(None),
    is_ticker_item: Optional[bool] = Query(None),
    priority: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Article)
    if status_filter:
        query = query.filter(Article.status == status_filter)
    if channel_id:
        query = query.filter(Article.channel_id == channel_id)
    if is_ticker_item is not None:
        query = query.filter(Article.is_ticker_item == is_ticker_item)
    if priority:
        query = query.filter(Article.priority == priority)

    return query.order_by(Article.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
def create_article(
    article_in: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Journalist", "Editor", "News Manager", "Admin"])
    ),
):
    article = Article(
        **article_in.model_dump(),
        author_id=current_user.id,
        version=1,
    )
    if article.status == "PUBLISHED":
        article.published_at = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        )

    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Article not found"
        )
    return article


@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: str,
    article_in: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(["Journalist", "Editor", "News Manager", "Admin"])
    ),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Article not found"
        )

    # Optimistic locking check
    if article_in.version is not None and article_in.version != article.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conflict: Article has been updated by another user. Current version is {article.version}, provided version is {article_in.version}.",
        )

    update_data = article_in.model_dump(exclude_unset=True)
    if "version" in update_data:
        del update_data["version"]

    for field, value in update_data.items():
        setattr(article, field, value)

    article.version += 1
    db.commit()
    db.refresh(article)
    return article


@router.patch("/{article_id}/status", response_model=ArticleResponse)
def update_article_status(
    article_id: str,
    status_in: ArticleStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Editor", "News Manager", "Admin"])),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Article not found"
        )

    article.status = status_in.status
    if status_in.reviewer_id:
        article.reviewer_id = status_in.reviewer_id
    else:
        article.reviewer_id = current_user.id

    if status_in.status == "PUBLISHED" and not article.published_at:
        article.published_at = datetime.datetime.now(datetime.timezone.utc).replace(
            tzinfo=None
        )

    article.version += 1
    db.commit()
    db.refresh(article)
    return article


@router.delete("/{article_id}", response_model=ArticleResponse)
def delete_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["News Manager", "Admin"])),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Article not found"
        )

    article.status = "ARCHIVED"
    article.version += 1
    db.commit()
    db.refresh(article)
    return article
