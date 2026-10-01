"""Educational quizzes and trivia router."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.app.database import get_db
from server.app import schemas
from server.app.services import quiz_service

router = APIRouter(prefix="/api/v1/quizzes", tags=["Quizzes"])


@router.get("/daily", response_model=List[schemas.QuizQuestionResponse])
def get_daily_quizzes_endpoint(
    db: Session = Depends(get_db),
):
    return quiz_service.get_daily_quizzes(db)


@router.post("/submit", response_model=schemas.QuizSubmitResponse)
def submit_quiz_endpoint(
    request: schemas.QuizSubmitRequest,
    db: Session = Depends(get_db),
):
    return quiz_service.submit_quiz_answers(db, request)
