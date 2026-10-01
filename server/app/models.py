"""SQLAlchemy Database Models."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from server.app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="PARENT")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    children = relationship(
        "Child", back_populates="parent", cascade="all, delete-orphan"
    )


class Child(Base):
    __tablename__ = "children"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parent_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    display_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    total_points = Column(Integer, default=0, nullable=False)
    active_streak_days = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    parent = relationship("User", back_populates="children")
    meals = relationship("Meal", back_populates="child", cascade="all, delete-orphan")
    child_badges = relationship(
        "ChildBadge", back_populates="child", cascade="all, delete-orphan"
    )
    child_avatars = relationship(
        "ChildAvatar", back_populates="child", cascade="all, delete-orphan"
    )


class Meal(Base):
    __tablename__ = "meals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("children.id"), nullable=False)
    meal_type = Column(String(50), nullable=False)  # BREAKFAST, LUNCH, DINNER, SNACK
    water_glasses = Column(Integer, default=0, nullable=False)
    logged_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    child = relationship("Child", back_populates="meals")
    items = relationship(
        "MealItem", back_populates="meal", cascade="all, delete-orphan"
    )


class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    meal_id = Column(String(36), ForeignKey("meals.id"), nullable=False)
    food_name = Column(String(150), nullable=False)
    food_category = Column(
        String(50), nullable=False
    )  # FRUITS, VEGGIES, GRAINS, PROTEINS, DAIRY, TREATS
    servings = Column(Float, nullable=False, default=1.0)

    meal = relationship("Meal", back_populates="items")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    point_reward = Column(Integer, default=100, nullable=False)

    child_badges = relationship("ChildBadge", back_populates="badge")


class ChildBadge(Base):
    __tablename__ = "child_badges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("children.id"), nullable=False)
    badge_id = Column(String(36), ForeignKey("badges.id"), nullable=False)
    unlocked_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    child = relationship("Child", back_populates="child_badges")
    badge = relationship("Badge", back_populates="child_badges")


class AvatarItem(Base):
    __tablename__ = "avatar_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # HAT, OUTFIT, ACCESSORY, BACKGROUND
    cost_points = Column(Integer, nullable=False)
    asset_key = Column(String(100), nullable=False)

    child_avatars = relationship("ChildAvatar", back_populates="avatar_item")


class ChildAvatar(Base):
    __tablename__ = "child_avatars"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("children.id"), nullable=False)
    avatar_item_id = Column(String(36), ForeignKey("avatar_items.id"), nullable=False)
    is_equipped = Column(Boolean, default=False, nullable=False)
    acquired_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    child = relationship("Child", back_populates="child_avatars")
    avatar_item = relationship("AvatarItem", back_populates="child_avatars")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_text = Column(Text, nullable=False)
    options = Column(Text, nullable=False)  # JSON-encoded string
    correct_option = Column(String(200), nullable=False)
    points_reward = Column(Integer, default=50, nullable=False)
    explanation = Column(Text, nullable=True)
