import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from server.models import Base
from server.database import get_db, seed_data
from server.main import app
from server.auth import create_access_token

# Shared in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
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
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(db):
    from server.models import User

    admin = db.query(User).filter(User.email == "admin@example.com").first()
    return create_access_token({"sub": admin.id, "email": admin.email, "role": "ADMIN"})


@pytest.fixture
def doctor_token(db):
    from server.models import User

    doc = db.query(User).filter(User.email == "doctor@example.com").first()
    return create_access_token({"sub": doc.id, "email": doc.email, "role": "DOCTOR"})


@pytest.fixture
def nurse_token(db):
    from server.models import User

    nurse = db.query(User).filter(User.email == "nurse@example.com").first()
    return create_access_token({"sub": nurse.id, "email": nurse.email, "role": "NURSE"})


@pytest.fixture
def receptionist_token(db):
    from server.models import User

    rec = db.query(User).filter(User.email == "receptionist@example.com").first()
    return create_access_token(
        {"sub": rec.id, "email": rec.email, "role": "RECEPTIONIST"}
    )


@pytest.fixture
def patient_token(db):
    from server.models import User

    patient = db.query(User).filter(User.email == "test@example.com").first()
    return create_access_token(
        {"sub": patient.id, "email": patient.email, "role": "PATIENT"}
    )
