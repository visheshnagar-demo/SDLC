"""Educational food trivia and quiz service."""

import json
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from server.app import models, schemas


def get_daily_quizzes(db: Session) -> List[schemas.QuizQuestionResponse]:
    questions = db.query(models.QuizQuestion).all()
    results = []
    for q in questions:
        try:
            options_list = json.loads(q.options)
        except Exception:
            options_list = [opt.strip() for opt in q.options.split(",") if opt.strip()]

        results.append(
            schemas.QuizQuestionResponse(
                id=q.id,
                question_text=q.question_text,
                options=options_list,
                points_reward=q.points_reward,
                explanation=q.explanation,
            )
        )
    return results


def submit_quiz_answers(
    db: Session, req: schemas.QuizSubmitRequest
) -> schemas.QuizSubmitResponse:
    child = db.query(models.Child).filter(models.Child.id == req.child_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Child profile with id {req.child_id} not found.",
        )

    results = []
    total_earned = 0
    correct_count = 0

    for q_id, chosen_answer in req.answers.items():
        question = (
            db.query(models.QuizQuestion).filter(models.QuizQuestion.id == q_id).first()
        )
        if not question:
            continue

        is_correct = (
            chosen_answer.strip().lower() == question.correct_option.strip().lower()
        )
        earned = question.points_reward if is_correct else 0
        if is_correct:
            total_earned += earned
            correct_count += 1

        results.append(
            schemas.QuizResultDetail(
                question_id=q_id,
                is_correct=is_correct,
                correct_option=question.correct_option,
                explanation=question.explanation,
                points_earned=earned,
            )
        )

    child.total_points += total_earned
    db.commit()
    db.refresh(child)

    return schemas.QuizSubmitResponse(
        child_id=child.id,
        total_earned_points=total_earned,
        correct_count=correct_count,
        total_questions=len(req.answers),
        updated_total_points=child.total_points,
        results=results,
    )
