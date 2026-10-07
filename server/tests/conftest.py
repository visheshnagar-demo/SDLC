import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.main import app
from server.database import get_db
from server.models import Base, User
from server.auth import hash_password, create_access_token
from server.seed import seed_data

# In-memory SQLite test database with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers(db_session):
    admin = db_session.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        admin = User(
            email="admin@example.com",
            hashed_password=hash_password("adminpassword"),
            full_name="Admin Manager",
            role="farm_manager",
            is_active=True,
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)

    token = create_access_token(
        data={
            "sub": admin.id,
            "email": admin.email,
            "role": admin.role,
            "full_name": admin.full_name,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def worker_headers(db_session):
    worker = db_session.query(User).filter(User.email == "test@example.com").first()
    if not worker:
        worker = User(
            email="test@example.com",
            hashed_password=hash_password("testpassword"),
            full_name="Farm Worker",
            role="farm_worker",
            is_active=True,
        )
        db_session.add(worker)
        db_session.commit()
        db_session.refresh(worker)

    token = create_access_token(
        data={
            "sub": worker.id,
            "email": worker.email,
            "role": worker.role,
            "full_name": worker.full_name,
        }
    )
    return {"Authorization": f"Bearer {token}"}
