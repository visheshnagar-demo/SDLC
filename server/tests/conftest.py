import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from server.app.api.deps import get_db
from server.app.core.database import Base, seed_data
from server.app.core.security import create_access_token
from server.app.main import app

# Single test database engine with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Import all models to ensure metadata is populated
    import server.app.models.user  # noqa: F401
    import server.app.models.patient  # noqa: F401
    import server.app.models.doctor  # noqa: F401
    import server.app.models.appointment  # noqa: F401
    import server.app.models.medical_record  # noqa: F401
    import server.app.models.audit_log  # noqa: F401

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    seed_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


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
    token = create_access_token(
        subject="00000000-0000-4000-a000-000000000000",
        role="ADMIN",
        email="admin@example.com",
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def doctor_headers():
    token = create_access_token(
        subject="11111111-1111-4111-a111-111111111111",
        role="DOCTOR",
        email="test@example.com",
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient_headers():
    token = create_access_token(
        subject="22222222-2222-4222-a222-222222222222",
        role="PATIENT",
        email="patient@example.com",
    )
    return {"Authorization": f"Bearer {token}"}
