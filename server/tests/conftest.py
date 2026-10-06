import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["TESTING"] = "true"

from server.database import Base, get_db, seed_data
from server.main import app
from server import models  # noqa: F401
from server.auth import create_access_token

# Single shared in-memory SQLite engine for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers():
    token = create_access_token(
        data={"sub": "admin@example.com", "role": "Admin", "name": "Admin User"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def doctor_headers():
    token = create_access_token(
        data={
            "sub": "doctor@example.com",
            "role": "Doctor",
            "name": "Dr. Sarah Jenkins",
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient_headers():
    token = create_access_token(
        data={"sub": "test@example.com", "role": "Patient", "name": "Jane Doe"}
    )
    return {"Authorization": f"Bearer {token}"}
