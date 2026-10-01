"""Database configuration and session management."""

import os
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode("utf-8")[:72]
    hashed_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(target_engine=None):
    """Create all tables in the database idempotently."""
    eng = target_engine or engine
    from server.app import models  # noqa: F401

    Base.metadata.create_all(bind=eng)


def seed_data(db: Session):
    """Seed initial data idempotently for development and testing."""
    from server.app import models

    # 1. Seed Parent User
    parent_user = (
        db.query(models.User).filter(models.User.email == "test@example.com").first()
    )
    if not parent_user:
        parent_user = models.User(
            id=str(uuid.uuid4()),
            email="test@example.com",
            hashed_password=get_password_hash("testpassword"),
            role="PARENT",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(parent_user)
        db.commit()
        db.refresh(parent_user)

    # 2. Seed Admin User
    admin_user = (
        db.query(models.User).filter(models.User.email == "admin@example.com").first()
    )
    if not admin_user:
        admin_user = models.User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            hashed_password=get_password_hash("adminpassword"),
            role="ADMIN",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(admin_user)
        db.commit()

    # 3. Seed Child Profile
    leo_child = (
        db.query(models.Child)
        .filter(
            models.Child.parent_id == parent_user.id, models.Child.display_name == "Leo"
        )
        .first()
    )
    if not leo_child:
        leo_child = models.Child(
            id=str(uuid.uuid4()),
            parent_id=parent_user.id,
            display_name="Leo",
            age=7,
            total_points=150,
            active_streak_days=5,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(leo_child)
        db.commit()
        db.refresh(leo_child)

    # 4. Seed Badges
    badges_data = [
        {
            "code": "VEGGIE_HERO_5",
            "title": "Veggie Hero",
            "description": "Meet daily vegetable target for 5 consecutive days",
            "point_reward": 100,
        },
        {
            "code": "HYDRATION_MASTER",
            "title": "Hydration Master",
            "description": "Drink 4+ glasses of water 5 days in a week",
            "point_reward": 100,
        },
        {
            "code": "RAINBOW_PLATE",
            "title": "Rainbow Plate",
            "description": "Log all 4 meal types in a single day",
            "point_reward": 150,
        },
        {
            "code": "FRUIT_FANATIC",
            "title": "Fruit Fanatic",
            "description": "Log at least 10 fruit servings in a week",
            "point_reward": 100,
        },
    ]

    for b in badges_data:
        existing_badge = (
            db.query(models.Badge).filter(models.Badge.code == b["code"]).first()
        )
        if not existing_badge:
            new_badge = models.Badge(
                id=str(uuid.uuid4()),
                code=b["code"],
                title=b["title"],
                description=b["description"],
                point_reward=b["point_reward"],
            )
            db.add(new_badge)
            db.commit()

    # Link Veggie Hero badge to Leo
    veggie_badge = (
        db.query(models.Badge).filter(models.Badge.code == "VEGGIE_HERO_5").first()
    )
    if veggie_badge and leo_child:
        child_badge = (
            db.query(models.ChildBadge)
            .filter(
                models.ChildBadge.child_id == leo_child.id,
                models.ChildBadge.badge_id == veggie_badge.id,
            )
            .first()
        )
        if not child_badge:
            child_badge = models.ChildBadge(
                id=str(uuid.uuid4()),
                child_id=leo_child.id,
                badge_id=veggie_badge.id,
                unlocked_at=datetime.now(timezone.utc),
            )
            db.add(child_badge)
            db.commit()

    # 5. Seed Avatar Items
    avatar_items_data = [
        {
            "item_name": "Superhero Cape",
            "category": "OUTFIT",
            "cost_points": 200,
            "asset_key": "cape_superhero",
        },
        {
            "item_name": "Top Hat",
            "category": "HAT",
            "cost_points": 100,
            "asset_key": "hat_top",
        },
        {
            "item_name": "Star Glasses",
            "category": "ACCESSORY",
            "cost_points": 50,
            "asset_key": "acc_star_glasses",
        },
        {
            "item_name": "Rainbow Background",
            "category": "BACKGROUND",
            "cost_points": 120,
            "asset_key": "bg_rainbow",
        },
    ]

    for item in avatar_items_data:
        existing_item = (
            db.query(models.AvatarItem)
            .filter(models.AvatarItem.item_name == item["item_name"])
            .first()
        )
        if not existing_item:
            new_item = models.AvatarItem(
                id=str(uuid.uuid4()),
                item_name=item["item_name"],
                category=item["category"],
                cost_points=item["cost_points"],
                asset_key=item["asset_key"],
            )
            db.add(new_item)
            db.commit()

    # Link Top Hat to Leo as equipped
    top_hat = (
        db.query(models.AvatarItem)
        .filter(models.AvatarItem.item_name == "Top Hat")
        .first()
    )
    if top_hat and leo_child:
        child_avatar = (
            db.query(models.ChildAvatar)
            .filter(
                models.ChildAvatar.child_id == leo_child.id,
                models.ChildAvatar.avatar_item_id == top_hat.id,
            )
            .first()
        )
        if not child_avatar:
            child_avatar = models.ChildAvatar(
                id=str(uuid.uuid4()),
                child_id=leo_child.id,
                avatar_item_id=top_hat.id,
                is_equipped=True,
                acquired_at=datetime.now(timezone.utc),
            )
            db.add(child_avatar)
            db.commit()

    # 6. Seed Trivia Quizzes
    quiz_questions = [
        {
            "question_text": "Which crunchy snack is full of Vitamin C and gives your eyes super vision powers?",
            "options": '["Crunchy Carrots 🥕", "Chocolate Donut 🍩", "French Fries 🍟", "Soda Pop 🥤"]',
            "correct_option": "Crunchy Carrots 🥕",
            "points_reward": 50,
            "explanation": "Carrots contain beta-carotene and vitamins that support healthy eyes and vision!",
        },
        {
            "question_text": "How many glasses of water should kids aim to drink every day?",
            "options": '["1-2 glasses", "6-8 glasses", "20 glasses", "0 glasses"]',
            "correct_option": "6-8 glasses",
            "points_reward": 50,
            "explanation": "Staying hydrated with 6-8 glasses of water keeps your brain and muscles energized!",
        },
        {
            "question_text": "Which of these foods gives you long-lasting morning energy from whole grains?",
            "options": '["Oatmeal with Berries", "Candy Bar", "Potato Chips", "Lollipop"]',
            "correct_option": "Oatmeal with Berries",
            "points_reward": 50,
            "explanation": "Oatmeal is packed with fiber and whole grains that keep your tummy full and energized!",
        },
    ]

    for q in quiz_questions:
        existing_q = (
            db.query(models.QuizQuestion)
            .filter(models.QuizQuestion.question_text == q["question_text"])
            .first()
        )
        if not existing_q:
            new_q = models.QuizQuestion(
                id=str(uuid.uuid4()),
                question_text=q["question_text"],
                options=q["options"],
                correct_option=q["correct_option"],
                points_reward=q["points_reward"],
                explanation=q["explanation"],
            )
            db.add(new_q)
            db.commit()

    # 7. Seed Sample Meals for Leo
    if leo_child:
        existing_meals = (
            db.query(models.Meal).filter(models.Meal.child_id == leo_child.id).count()
        )
        if existing_meals == 0:
            now = datetime.now(timezone.utc)
            # Breakfast
            m1 = models.Meal(
                id=str(uuid.uuid4()),
                child_id=leo_child.id,
                meal_type="BREAKFAST",
                water_glasses=1,
                logged_at=now - timedelta(hours=5),
                created_at=now - timedelta(hours=5),
            )
            db.add(m1)
            db.commit()
            db.refresh(m1)
            i1 = models.MealItem(
                id=str(uuid.uuid4()),
                meal_id=m1.id,
                food_name="Oatmeal with Honey",
                food_category="GRAINS",
                servings=1.0,
            )
            i2 = models.MealItem(
                id=str(uuid.uuid4()),
                meal_id=m1.id,
                food_name="Fresh Apple Slices",
                food_category="FRUITS",
                servings=1.0,
            )
            db.add_all([i1, i2])

            # Lunch
            m2 = models.Meal(
                id=str(uuid.uuid4()),
                child_id=leo_child.id,
                meal_type="LUNCH",
                water_glasses=2,
                logged_at=now - timedelta(hours=2),
                created_at=now - timedelta(hours=2),
            )
            db.add(m2)
            db.commit()
            db.refresh(m2)
            i3 = models.MealItem(
                id=str(uuid.uuid4()),
                meal_id=m2.id,
                food_name="Turkey Sandwich",
                food_category="PROTEINS",
                servings=1.0,
            )
            i4 = models.MealItem(
                id=str(uuid.uuid4()),
                meal_id=m2.id,
                food_name="Carrot Sticks",
                food_category="VEGGIES",
                servings=1.0,
            )
            db.add_all([i3, i4])
            db.commit()
