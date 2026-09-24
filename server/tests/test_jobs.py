import pytest
from fastapi.testclient import TestClient
from server.core.security import create_access_token


@pytest.fixture
def user_token():
    return create_access_token(data={"sub": "test@example.com", "role": "user"})


@pytest.fixture
def admin_token():
    return create_access_token(data={"sub": "admin@example.com", "role": "admin"})


@pytest.fixture
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def test_auth_login(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user_role"] == "admin"


def test_create_job_success(client: TestClient, admin_headers):
    payload = {
        "title": "Senior Backend Developer",
        "description": "Seeking Python/FastAPI expert to build distributed APIs.",
        "department": "Engineering",
        "location": "Remote",
        "employment_type": "Full-time",
        "salary_min": 120000.0,
        "salary_max": 150000.0,
        "currency": "USD",
        "status": "draft",
    }
    response = client.post("/api/v1/jobs", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["department"] == "Engineering"
    assert data["status"] == "draft"
    assert "id" in data


def test_create_job_validation_errors(client: TestClient, admin_headers):
    # Empty title
    payload_empty_title = {
        "title": "   ",
        "description": "Valid description",
        "department": "Engineering",
        "location": "Remote",
        "employment_type": "Full-time",
    }
    res1 = client.post("/api/v1/jobs", json=payload_empty_title, headers=admin_headers)
    assert res1.status_code == 422

    # Negative salary
    payload_neg_salary = {
        "title": "Software Engineer",
        "description": "Valid description",
        "department": "Engineering",
        "location": "Remote",
        "employment_type": "Full-time",
        "salary_min": -1000,
    }
    res2 = client.post("/api/v1/jobs", json=payload_neg_salary, headers=admin_headers)
    assert res2.status_code == 422

    # salary_min > salary_max
    payload_invalid_range = {
        "title": "Software Engineer",
        "description": "Valid description",
        "department": "Engineering",
        "location": "Remote",
        "employment_type": "Full-time",
        "salary_min": 150000.0,
        "salary_max": 100000.0,
    }
    res3 = client.post(
        "/api/v1/jobs", json=payload_invalid_range, headers=admin_headers
    )
    assert res3.status_code == 422


def test_list_and_filter_jobs(client: TestClient, admin_headers):
    # Create draft job
    draft_job = client.post(
        "/api/v1/jobs",
        json={
            "title": "Draft QA Engineer",
            "description": "QA role description",
            "department": "QA",
            "location": "New York",
            "employment_type": "Full-time",
            "status": "draft",
        },
        headers=admin_headers,
    ).json()

    # Create published job
    published_job = client.post(
        "/api/v1/jobs",
        json={
            "title": "Published Frontend Engineer",
            "description": "React Developer role",
            "department": "Frontend",
            "location": "Remote",
            "employment_type": "Contract",
            "status": "published",
        },
        headers=admin_headers,
    ).json()

    # Public unauthenticated search
    public_res = client.get("/api/v1/jobs")
    assert public_res.status_code == 200
    public_data = public_res.json()
    # Public should only see published jobs
    assert all(item["status"] == "published" for item in public_data["items"])
    assert any(item["id"] == published_job["id"] for item in public_data["items"])
    assert not any(item["id"] == draft_job["id"] for item in public_data["items"])

    # Admin search filtered by status=draft
    admin_res = client.get("/api/v1/jobs?status=draft", headers=admin_headers)
    assert admin_res.status_code == 200
    admin_data = admin_res.json()
    assert any(item["id"] == draft_job["id"] for item in admin_data["items"])

    # Search filter
    search_res = client.get("/api/v1/jobs?search=React", headers=admin_headers)
    assert search_res.status_code == 200
    assert any("Frontend" in item["title"] for item in search_res.json()["items"])


def test_get_job_details_rbac(client: TestClient, admin_headers):
    job = client.post(
        "/api/v1/jobs",
        json={
            "title": "DevOps Architect",
            "description": "Cloud Run & Kubernetes expert",
            "department": "Infrastructure",
            "location": "Remote",
            "employment_type": "Full-time",
            "status": "draft",
        },
        headers=admin_headers,
    ).json()

    job_id = job["id"]

    # Public guest gets 404 for draft job
    res_public = client.get(f"/api/v1/jobs/{job_id}")
    assert res_public.status_code == 404

    # Admin gets 200 for draft job
    res_admin = client.get(f"/api/v1/jobs/{job_id}", headers=admin_headers)
    assert res_admin.status_code == 200
    assert res_admin.json()["title"] == "DevOps Architect"

    # Publish job
    client.patch(
        f"/api/v1/jobs/{job_id}/status",
        json={"status": "published"},
        headers=admin_headers,
    )

    # Public guest now gets 200 for published job
    res_public_published = client.get(f"/api/v1/jobs/{job_id}")
    assert res_public_published.status_code == 200


def test_job_status_transition_lifecycle(
    client: TestClient, admin_headers, user_headers
):
    job = client.post(
        "/api/v1/jobs",
        json={
            "title": "Product Manager",
            "description": "PM role description",
            "department": "Product",
            "location": "San Francisco",
            "employment_type": "Full-time",
            "status": "draft",
        },
        headers=admin_headers,
    ).json()

    job_id = job["id"]

    # draft -> published
    res1 = client.patch(
        f"/api/v1/jobs/{job_id}/status",
        json={"status": "published"},
        headers=admin_headers,
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "published"

    # published -> closed
    res2 = client.patch(
        f"/api/v1/jobs/{job_id}/status",
        json={"status": "closed"},
        headers=admin_headers,
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "closed"

    # transition to same status -> 400 Bad Request
    res_same = client.patch(
        f"/api/v1/jobs/{job_id}/status",
        json={"status": "closed"},
        headers=admin_headers,
    )
    assert res_same.status_code == 400

    # closed -> draft by non-admin user -> 400 Bad Request or 403 Forbidden
    res_non_admin_override = client.patch(
        f"/api/v1/jobs/{job_id}/status",
        json={"status": "draft"},
        headers=user_headers,
    )
    assert res_non_admin_override.status_code in [400, 403]


def test_update_and_delete_job(client: TestClient, admin_headers):
    job = client.post(
        "/api/v1/jobs",
        json={
            "title": "Junior Developer",
            "description": "Entry level Python dev",
            "department": "Engineering",
            "location": "Remote",
            "employment_type": "Full-time",
            "salary_min": 60000.0,
            "salary_max": 80000.0,
            "status": "draft",
        },
        headers=admin_headers,
    ).json()

    job_id = job["id"]

    # Update job
    update_res = client.put(
        f"/api/v1/jobs/{job_id}",
        json={
            "title": "Mid-level Developer",
            "salary_min": 85000.0,
            "salary_max": 105000.0,
        },
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Mid-level Developer"
    assert update_res.json()["salary_min"] == 85000.0

    # Delete job
    del_res = client.delete(f"/api/v1/jobs/{job_id}", headers=admin_headers)
    assert del_res.status_code == 204

    # Verify deleted
    get_res = client.get(f"/api/v1/jobs/{job_id}", headers=admin_headers)
    assert get_res.status_code == 404
