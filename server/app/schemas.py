"""Pydantic request and response schemas."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ==================== User / Auth Schemas ====================


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: Optional[str] = "PARENT"


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== Child Profile Schemas ====================


class ChildCreateRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=1, le=18)


class ChildUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=1, le=18)


class ChildResponse(BaseModel):
    id: str
    parent_id: str
    display_name: str
    age: int
    total_points: int
    active_streak_days: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Meal Schemas ====================


class MealItemCreate(BaseModel):
    food_name: str = Field(min_length=1, max_length=150)
    food_category: str = Field(
        pattern="^(FRUITS|VEGGIES|GRAINS|PROTEINS|DAIRY|TREATS)$"
    )
    servings: float = Field(gt=0, le=20)


class MealItemResponse(BaseModel):
    id: str
    meal_id: str
    food_name: str
    food_category: str
    servings: float

    class Config:
        from_attributes = True


class MealCreateRequest(BaseModel):
    child_id: str
    meal_type: str = Field(pattern="^(BREAKFAST|LUNCH|DINNER|SNACK)$")
    logged_at: Optional[datetime] = None
    items: List[MealItemCreate] = Field(default_factory=list)
    water_glasses: int = Field(default=0, ge=0, le=20)


class MealResponse(BaseModel):
    id: str
    child_id: str
    meal_type: str
    water_glasses: int
    logged_at: datetime
    created_at: datetime
    items: List[MealItemResponse] = []

    class Config:
        from_attributes = True


class MealCreateResponse(BaseModel):
    meal: MealResponse
    points_awarded: int
    active_streak_days: int
    new_badges_unlocked: List[str] = []
    daily_fruit_servings: float
    daily_veggie_servings: float
    daily_grain_servings: float
    daily_protein_servings: float
    daily_dairy_servings: float
    daily_water_glasses: int


# ==================== Dashboard Schemas ====================


class CategoryProgress(BaseModel):
    fruits_percentage: float
    vegetables_percentage: float
    grains_percentage: float
    proteins_percentage: float
    dairy_percentage: float
    water_percentage: float


class WeeklyDashboardResponse(BaseModel):
    child_id: str
    week_start_date: str
    week_end_date: str
    completion_rate_percentage: float
    category_progress: CategoryProgress
    recommendations: List[str]
    total_meals_logged: int
    active_streak_days: int


# ==================== Rewards & Badges Schemas ====================


class BadgeResponse(BaseModel):
    id: str
    code: str
    title: str
    description: str
    point_reward: int
    unlocked: bool
    unlocked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StreakResponse(BaseModel):
    child_id: str
    active_streak_days: int
    total_points: int
    progress_indicators: Dict[str, Any]


# ==================== Quizzes Schemas ====================


class QuizQuestionResponse(BaseModel):
    id: str
    question_text: str
    options: List[str]
    points_reward: int
    explanation: Optional[str] = None


class QuizSubmitRequest(BaseModel):
    child_id: str
    answers: Dict[str, str]  # question_id -> chosen option string


class QuizResultDetail(BaseModel):
    question_id: str
    is_correct: bool
    correct_option: str
    explanation: Optional[str] = None
    points_earned: int


class QuizSubmitResponse(BaseModel):
    child_id: str
    total_earned_points: int
    correct_count: int
    total_questions: int
    updated_total_points: int
    results: List[QuizResultDetail]


# ==================== Avatar Schemas ====================


class AvatarItemResponse(BaseModel):
    id: str
    item_name: str
    category: str
    cost_points: int
    asset_key: str
    is_unlocked: bool = False
    is_equipped: bool = False

    class Config:
        from_attributes = True


class AvatarUnlockRequest(BaseModel):
    child_id: str
    item_id: str


class AvatarEquipRequest(BaseModel):
    child_id: str
    item_id: str
    is_equipped: bool = True


class AvatarEquipResponse(BaseModel):
    child_id: str
    equipped_items: List[AvatarItemResponse]
