import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.auth import create_access_token
from server.database import get_db, seed_data
from server.main import app
from server.models import Base, User

# Shared in-memory SQLite database for test suite
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
    seed_data(db)
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
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def host_user(db_session):
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    return user


@pytest.fixture
def admin_user(db_session):
    user = db_session.query(User).filter(User.email == "admin@example.com").first()
    return user


@pytest.fixture
def receptionist_user(db_session):
    user = (
        db_session.query(User).filter(User.email == "receptionist@example.com").first()
    )
    return user


@pytest.fixture
def host_headers(host_user):
    token = create_access_token(
        data={"sub": host_user.id, "email": host_user.email, "role": host_user.role}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token(
        data={"sub": admin_user.id, "email": admin_user.email, "role": admin_user.role}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def receptionist_headers(receptionist_user):
    token = create_access_token(
        data={
            "sub": receptionist_user.id,
            "email": receptionist_user.email,
            "role": receptionist_user.role,
        }
    )
    return {"Authorization": f"Bearer {token}"}
