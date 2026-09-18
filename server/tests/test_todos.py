import uuid
from fastapi import status


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"status": "healthy"}


def test_create_task_success(client):
    payload = {
        "title": "Buy groceries",
        "description": "Milk, eggs, bread",
    }
    response = client.post("/api/v1/todos", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Buy groceries"
    assert data["description"] == "Milk, eggs, bread"
    assert data["is_completed"] is False
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_task_without_description(client):
    payload = {
        "title": "Clean room",
    }
    response = client.post("/api/v1/todos", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Clean room"
    assert data["description"] is None
    assert data["is_completed"] is False


def test_create_task_validation_error_empty_title(client):
    payload = {
        "title": "   ",
        "description": "Empty title test",
    }
    response = client.post("/api/v1/todos", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_list_tasks_empty(client):
    response = client.get("/api/v1/todos")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_list_tasks_sorted(client):
    # Create two tasks
    client.post("/api/v1/todos", json={"title": "Task 1"})
    client.post("/api/v1/todos", json={"title": "Task 2"})

    response = client.get("/api/v1/todos")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    # Newest task first
    assert data[0]["title"] == "Task 2"
    assert data[1]["title"] == "Task 1"


def test_get_task_by_id_success(client):
    create_res = client.post(
        "/api/v1/todos", json={"title": "Read a book", "description": "Sci-fi novel"}
    )
    todo_id = create_res.json()["id"]

    response = client.get(f"/api/v1/todos/{todo_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == todo_id
    assert data["title"] == "Read a book"
    assert data["description"] == "Sci-fi novel"


def test_get_task_by_id_not_found(client):
    random_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/todos/{random_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Todo item not found"


def test_get_task_invalid_uuid(client):
    response = client.get("/api/v1/todos/not-a-valid-uuid")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_mark_task_complete_toggle(client):
    create_res = client.post("/api/v1/todos", json={"title": "Exercise"})
    todo_id = create_res.json()["id"]

    # Toggle to complete
    update_res = client.put(f"/api/v1/todos/{todo_id}", json={"is_completed": True})
    assert update_res.status_code == status.HTTP_200_OK
    assert update_res.json()["is_completed"] is True

    # Toggle back to incomplete
    update_res2 = client.put(f"/api/v1/todos/{todo_id}", json={"is_completed": False})
    assert update_res2.status_code == status.HTTP_200_OK
    assert update_res2.json()["is_completed"] is False


def test_update_task_details(client):
    create_res = client.post(
        "/api/v1/todos",
        json={"title": "Draft email", "description": "Draft report for team"},
    )
    todo_id = create_res.json()["id"]

    update_payload = {
        "title": "Send email",
        "description": "Send weekly status report to team",
    }
    update_res = client.put(f"/api/v1/todos/{todo_id}", json=update_payload)
    assert update_res.status_code == status.HTTP_200_OK
    data = update_res.json()
    assert data["title"] == "Send email"
    assert data["description"] == "Send weekly status report to team"


def test_update_task_not_found(client):
    random_id = str(uuid.uuid4())
    response = client.put(f"/api/v1/todos/{random_id}", json={"title": "Doesn't exist"})
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_task_blank_title_validation(client):
    create_res = client.post("/api/v1/todos", json={"title": "Initial title"})
    todo_id = create_res.json()["id"]

    response = client.put(f"/api/v1/todos/{todo_id}", json={"title": "  "})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_delete_task_success(client):
    create_res = client.post("/api/v1/todos", json={"title": "Task to delete"})
    todo_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/todos/{todo_id}")
    assert del_res.status_code == status.HTTP_204_NO_CONTENT

    get_res = client.get(f"/api/v1/todos/{todo_id}")
    assert get_res.status_code == status.HTTP_404_NOT_FOUND


def test_delete_task_not_found(client):
    random_id = str(uuid.uuid4())
    response = client.delete(f"/api/v1/todos/{random_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_filter_tasks_by_status(client):
    # Create active task
    client.post("/api/v1/todos", json={"title": "Active Task 1"})
    # Create completed task
    res = client.post("/api/v1/todos", json={"title": "Completed Task 1"})
    completed_id = res.json()["id"]
    client.put(f"/api/v1/todos/{completed_id}", json={"is_completed": True})

    # Test filter=active
    active_res = client.get("/api/v1/todos?status=active")
    assert active_res.status_code == status.HTTP_200_OK
    active_tasks = active_res.json()
    assert len(active_tasks) == 1
    assert active_tasks[0]["title"] == "Active Task 1"
    assert active_tasks[0]["is_completed"] is False

    # Test filter=completed
    completed_res = client.get("/api/v1/todos?status=completed")
    assert completed_res.status_code == status.HTTP_200_OK
    completed_tasks = completed_res.json()
    assert len(completed_tasks) == 1
    assert completed_tasks[0]["title"] == "Completed Task 1"
    assert completed_tasks[0]["is_completed"] is True

    # Test filter=all
    all_res = client.get("/api/v1/todos?status=all")
    assert all_res.status_code == status.HTTP_200_OK
    assert len(all_res.json()) == 2


def test_filter_invalid_status(client):
    response = client.get("/api/v1/todos?status=unknown")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_search_tasks_by_keyword(client):
    client.post(
        "/api/v1/todos", json={"title": "Buy groceries", "description": "Milk and eggs"}
    )
    client.post(
        "/api/v1/todos",
        json={"title": "Doctor appointment", "description": "Annual checkup"},
    )
    client.post(
        "/api/v1/todos",
        json={
            "title": "Gym workout",
            "description": "Leg day and groceries shopping list",
        },
    )

    # Search for "groceries" matching in title of first and description of third
    search_res = client.get("/api/v1/todos?search=groceries")
    assert search_res.status_code == status.HTTP_200_OK
    results = search_res.json()
    assert len(results) == 2
    titles = [t["title"] for t in results]
    assert "Buy groceries" in titles
    assert "Gym workout" in titles


def test_pagination(client):
    for i in range(5):
        client.post("/api/v1/todos", json={"title": f"Task {i + 1}"})

    response = client.get("/api/v1/todos?skip=1&limit=2")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    # Tasks are sorted newest first (Task 5, Task 4, Task 3, Task 2, Task 1)
    # skip=1, limit=2 returns Task 4, Task 3
    assert data[0]["title"] == "Task 4"
    assert data[1]["title"] == "Task 3"
