import pytest
from fastapi.testclient import TestClient

from server.main import app
from server.database import Base, engine

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Sales Data ETL Pipeline Service"
    assert data["status"] == "online"


def test_health_endpoint():
    Base.metadata.create_all(bind=engine)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True
    assert data["bigquery_accessible"] is True
