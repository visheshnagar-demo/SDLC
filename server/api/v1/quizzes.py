from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.core.database import get_db
from server.models.user import User
from server.models.module import Module
from server.models.quiz import Quiz, QuizQuestion
from server.models.progress import UserProgress
from server.schemas.quiz import (
    QuizDetail,
    QuizQuestionOut,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuestionFeedback,
)
from server.api.v1.auth import get_current_user

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/{module_id}", response_model=QuizDetail)
def get_quiz_by_module(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Lookup by module_id or by quiz id
    quiz = (
        db.query(Quiz)
        .filter((Quiz.module_id == module_id) | (Quiz.id == module_id))
        .first()
    )
    if not quiz:
        # Check by module slug
        module = db.query(Module).filter(Module.slug == module_id).first()
        if module:
            quiz = db.query(Quiz).filter(Quiz.module_id == module.id).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found for the given module",
        )

    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.order_index.asc())
        .all()
    )

    questions_out = [
        QuizQuestionOut(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            options=q.options or [],
            order_index=q.order_index,
        )
        for q in questions
    ]

    return QuizDetail(
        id=quiz.id,
        module_id=quiz.module_id,
        title=quiz.title,
        passing_score=quiz.passing_score,
        total_questions=len(questions_out),
        questions=questions_out,
    )


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    quiz_id: str,
    submission: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = (
        db.query(Quiz)
        .filter((Quiz.id == quiz_id) | (Quiz.module_id == quiz_id))
        .first()
    )
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz '{quiz_id}' not found",
        )

    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.order_index.asc())
        .all()
    )

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions to evaluate",
        )

    user_answers_map = {
        ans.question_id: ans.selected_option.strip().lower()
        for ans in submission.answers
    }

    correct_count = 0
    feedback_list = []

    for q in questions:
        selected = user_answers_map.get(q.id, "")
        is_corr = selected == q.correct_answer.strip().lower()
        if is_corr:
            correct_count += 1
        feedback_list.append(
            QuestionFeedback(
                question_id=q.id,
                is_correct=is_corr,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                selected_option=selected,
            )
        )

    total_q = len(questions)
    score_pct = round((correct_count / total_q) * 100.0, 1) if total_q > 0 else 0.0
    passed = score_pct >= quiz.passing_score

    # Upsert UserProgress
    progress = (
        db.query(UserProgress)
        .filter(
            UserProgress.user_id == current_user.id,
            UserProgress.module_id == quiz.module_id,
        )
        .first()
    )

    now = datetime.now(timezone.utc)
    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            module_id=quiz.module_id,
            is_completed=passed,
            quiz_score=int(score_pct),
            last_accessed_at=now,
        )
        db.add(progress)
    else:
        progress.last_accessed_at = now
        progress.quiz_score = int(score_pct)
        if passed:
            progress.is_completed = True

    db.commit()
    db.refresh(progress)

    return QuizSubmitResponse(
        quiz_id=quiz.id,
        module_id=quiz.module_id,
        score_percentage=score_pct,
        passed=passed,
        total_questions=total_q,
        correct_count=correct_count,
        passing_score=quiz.passing_score,
        feedback=feedback_list,
        is_completed=progress.is_completed,
    )
