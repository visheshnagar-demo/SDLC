import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from server.database import Base, get_db, init_db, seed_data
from server.main import app
from server.services.auth_service import create_access_token

# Shared in-memory SQLite engine with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    # Create all tables on the test engine
    init_db(target_engine=test_engine)
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
def admin_headers():
    token = create_access_token({"sub": "admin@example.com", "role": "ADMIN"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def doctor_headers():
    token = create_access_token({"sub": "doctor@example.com", "role": "DOCTOR"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def receptionist_headers():
    token = create_access_token({"sub": "test@example.com", "role": "RECEPTIONIST"})
    return {"Authorization": f"Bearer {token}"}
