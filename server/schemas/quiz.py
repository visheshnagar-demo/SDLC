from typing import Any
from pydantic import BaseModel, ConfigDict


class QuizOption(BaseModel):
    id: str
    text: str


class QuizQuestionOut(BaseModel):
    id: str
    quiz_id: str
    question_text: str
    options: list[dict[str, Any]]
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class QuizDetail(BaseModel):
    id: str
    module_id: str
    title: str
    passing_score: int
    total_questions: int
    questions: list[QuizQuestionOut]

    model_config = ConfigDict(from_attributes=True)


class AnswerSubmission(BaseModel):
    question_id: str
    selected_option: str


class QuizSubmitRequest(BaseModel):
    answers: list[AnswerSubmission]


class QuestionFeedback(BaseModel):
    question_id: str
    is_correct: bool
    correct_answer: str
    explanation: str
    selected_option: str


class QuizSubmitResponse(BaseModel):
    quiz_id: str
    module_id: str
    score_percentage: float
    passed: bool
    total_questions: int
    correct_count: int
    passing_score: int
    feedback: list[QuestionFeedback]
    is_completed: bool
