import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.auth import create_access_token
from server.database import Base, get_db
from server.main import app
from server.models import User
from server.seed_data import seed_data

# In-memory test engine with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables once for the test session and run initial seeding."""
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
    """Provide a transactional database session for tests with automatic rollback."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""

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
def customer_user(db_session):
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    if not user:
        seed_data(db_session)
        user = db_session.query(User).filter(User.email == "test@example.com").first()
    return user


@pytest.fixture
def admin_user(db_session):
    user = db_session.query(User).filter(User.email == "admin@example.com").first()
    if not user:
        seed_data(db_session)
        user = db_session.query(User).filter(User.email == "admin@example.com").first()
    return user


@pytest.fixture
def auth_headers_customer(customer_user):
    token = create_access_token(
        data={
            "sub": customer_user.id,
            "email": customer_user.email,
            "role": customer_user.role,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_admin(admin_user):
    token = create_access_token(
        data={"sub": admin_user.id, "email": admin_user.email, "role": admin_user.role}
    )
    return {"Authorization": f"Bearer {token}"}
