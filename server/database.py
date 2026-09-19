import os
import uuid
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import IntegrityError
import bcrypt

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def init_db():
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


def seed_data(db: Session):
    from server.models import (
        User,
        Channel,
        Program,
        Schedule,
        Article,
        ExchangeRateCache,
    )

    seed_users = [
        {
            "email": "test@example.com",
            "password": "testpassword",
            "role": "Journalist",
            "full_name": "Test Journalist",
        },
        {
            "email": "admin@example.com",
            "password": "adminpassword",
            "role": "Admin",
            "full_name": "System Administrator",
        },
        {
            "email": "manager@example.com",
            "password": "managerpassword",
            "role": "News Manager",
            "full_name": "News Operations Manager",
        },
        {
            "email": "editor@example.com",
            "password": "editorpassword",
            "role": "Editor",
            "full_name": "Senior Editor",
        },
        {
            "email": "journalist@example.com",
            "password": "journalistpassword",
            "role": "Journalist",
            "full_name": "Field Journalist",
        },
        {
            "email": "operator@example.com",
            "password": "operatorpassword",
            "role": "Operator",
            "full_name": "Master Control Operator",
        },
    ]

    user_map = {}
    for user_info in seed_users:
        try:
            user = db.query(User).filter(User.email == user_info["email"]).first()
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    email=user_info["email"],
                    hashed_password=get_password_hash(user_info["password"]),
                    full_name=user_info["full_name"],
                    role=user_info["role"],
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            user_map[user_info["role"]] = user
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(User.email == user_info["email"]).first()
            if user:
                user_map[user_info["role"]] = user

    # Seed initial channels
    seed_channels = [
        {
            "name": "Global News HD",
            "code": "GNEWS-HD",
            "stream_url": "https://stream.globalnews.example.com/live/hd.m3u8",
            "resolution": "1080p",
            "language": "English",
            "status": "ACTIVE",
            "is_live": True,
        },
        {
            "name": "World News 24/7",
            "code": "WORLD-24",
            "stream_url": "https://stream.worldnews.example.com/live/main.m3u8",
            "resolution": "4K",
            "language": "English",
            "status": "ACTIVE",
            "is_live": True,
        },
        {
            "name": "Financial News Channel",
            "code": "FIN-NEWS",
            "stream_url": "https://stream.financial.example.com/live/feed.m3u8",
            "resolution": "720p",
            "language": "English",
            "status": "ACTIVE",
            "is_live": False,
        },
    ]

    channel_map = {}
    for ch_info in seed_channels:
        try:
            channel = db.query(Channel).filter(Channel.code == ch_info["code"]).first()
            if not channel:
                channel = Channel(
                    id=str(uuid.uuid4()),
                    name=ch_info["name"],
                    code=ch_info["code"],
                    stream_url=ch_info["stream_url"],
                    resolution=ch_info["resolution"],
                    language=ch_info["language"],
                    status=ch_info["status"],
                    is_live=ch_info["is_live"],
                )
                db.add(channel)
                db.commit()
                db.refresh(channel)
            channel_map[ch_info["code"]] = channel
        except IntegrityError:
            db.rollback()
            channel = db.query(Channel).filter(Channel.code == ch_info["code"]).first()
            if channel:
                channel_map[ch_info["code"]] = channel

    # Seed initial programs
    seed_programs = [
        {
            "title": "Morning Global Bulletin",
            "category": "Breaking News",
            "description": "Daily morning roundup of global headlines and breaking news.",
            "default_duration_minutes": 60,
            "host_name": "Sarah Jenkins",
            "is_recurring": True,
        },
        {
            "title": "Evening Rundown & Analysis",
            "category": "Politics",
            "description": "In-depth political analysis and evening news summary.",
            "default_duration_minutes": 60,
            "host_name": "David Miller",
            "is_recurring": True,
        },
        {
            "title": "Market Watch Live",
            "category": "Finance",
            "description": "Real-time stock market analysis and financial reporting.",
            "default_duration_minutes": 30,
            "host_name": "Alex Rivera",
            "is_recurring": True,
        },
    ]

    program_map = {}
    for pr_info in seed_programs:
        try:
            program = (
                db.query(Program).filter(Program.title == pr_info["title"]).first()
            )
            if not program:
                program = Program(
                    id=str(uuid.uuid4()),
                    title=pr_info["title"],
                    category=pr_info["category"],
                    description=pr_info["description"],
                    default_duration_minutes=pr_info["default_duration_minutes"],
                    host_name=pr_info["host_name"],
                    is_recurring=pr_info["is_recurring"],
                )
                db.add(program)
                db.commit()
                db.refresh(program)
            program_map[pr_info["title"]] = program
        except IntegrityError:
            db.rollback()
            program = (
                db.query(Program).filter(Program.title == pr_info["title"]).first()
            )
            if program:
                program_map[pr_info["title"]] = program

    # Seed initial schedule slots
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    if "GNEWS-HD" in channel_map and "Morning Global Bulletin" in program_map:
        try:
            sch = (
                db.query(Schedule)
                .filter(Schedule.channel_id == channel_map["GNEWS-HD"].id)
                .first()
            )
            if not sch:
                sch1 = Schedule(
                    id=str(uuid.uuid4()),
                    channel_id=channel_map["GNEWS-HD"].id,
                    program_id=program_map["Morning Global Bulletin"].id,
                    start_time=now - datetime.timedelta(minutes=30),
                    end_time=now + datetime.timedelta(minutes=30),
                    status="LIVE",
                    is_emergency_override=False,
                    notes="Morning live bulletin on air",
                )
                db.add(sch1)
                db.commit()
        except IntegrityError:
            db.rollback()

    # Seed initial articles
    author = user_map.get("Journalist") or user_map.get("Admin")
    reviewer = user_map.get("Editor") or user_map.get("Admin")
    ch = channel_map.get("GNEWS-HD")
    pr = program_map.get("Morning Global Bulletin")
    if author:
        try:
            art = (
                db.query(Article)
                .filter(
                    Article.headline
                    == "Global Summit Reaches Landmark Climate Agreement"
                )
                .first()
            )
            if not art:
                art1 = Article(
                    id=str(uuid.uuid4()),
                    channel_id=ch.id if ch else None,
                    program_id=pr.id if pr else None,
                    author_id=author.id,
                    reviewer_id=reviewer.id if reviewer else None,
                    headline="Global Summit Reaches Landmark Climate Agreement",
                    body="World leaders at the international summit have finalized a historic agreement aimed at reducing global carbon emissions.",
                    summary="Historic climate agreement signed by 190 nations.",
                    is_ticker_item=False,
                    priority="HIGH",
                    status="PUBLISHED",
                    version=1,
                    published_at=now,
                )
                db.add(art1)

                ticker1 = Article(
                    id=str(uuid.uuid4()),
                    channel_id=ch.id if ch else None,
                    program_id=pr.id if pr else None,
                    author_id=author.id,
                    headline="BREAKING: Central Bank Announces Interest Rate Adjustment",
                    body="Central bank lowers benchmark rate by 25 basis points.",
                    summary="Interest rate cut announced.",
                    is_ticker_item=True,
                    priority="URGENT",
                    status="PUBLISHED",
                    version=1,
                    published_at=now,
                )
                db.add(ticker1)
                db.commit()
        except IntegrityError:
            db.rollback()

    # Seed initial exchange rates cache
    try:
        cache = (
            db.query(ExchangeRateCache)
            .filter(ExchangeRateCache.base_currency == "USD")
            .first()
        )
        if not cache:
            cache = ExchangeRateCache(
                id=str(uuid.uuid4()),
                base_currency="USD",
                rates_json='{"USD": 1.0, "EUR": 0.925, "GBP": 0.79, "JPY": 155.0, "CAD": 1.36}',
                fetched_at=now,
                expires_at=now + datetime.timedelta(minutes=15),
            )
            db.add(cache)
            db.commit()
    except IntegrityError:
        db.rollback()
