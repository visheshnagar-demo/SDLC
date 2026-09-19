import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from server.database import Base, get_db, seed_data
import server.models  # noqa: F401
from server.main import app
from server.auth import create_access_token
from server.models import User

# In-memory SQLite for testing with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


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
    token = create_access_token(
        data={"sub": admin.id, "email": admin.email, "role": admin.role}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def manager_headers(db_session):
    manager = db_session.query(User).filter(User.email == "manager@example.com").first()
    token = create_access_token(
        data={"sub": manager.id, "email": manager.email, "role": manager.role}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def journalist_headers(db_session):
    journalist = (
        db_session.query(User).filter(User.email == "journalist@example.com").first()
    )
    token = create_access_token(
        data={"sub": journalist.id, "email": journalist.email, "role": journalist.role}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def operator_headers(db_session):
    operator = (
        db_session.query(User).filter(User.email == "operator@example.com").first()
    )
    token = create_access_token(
        data={"sub": operator.id, "email": operator.email, "role": operator.role}
    )
    return {"Authorization": f"Bearer {token}"}
