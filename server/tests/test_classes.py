def test_get_classes(client):
    response = client.get("/api/v1/classes")
    assert response.status_code == 200
    classes = response.json()
    assert len(classes) >= 5
    for c in classes:
        assert "id" in c
        assert "title" in c
        assert "category" in c
        assert "available_spots" in c
        assert "is_full" in c


def test_filter_classes_by_category(client):
    response = client.get("/api/v1/classes?category=Yoga")
    assert response.status_code == 200
    classes = response.json()
    assert all("Yoga" in c["category"] for c in classes)


def test_filter_classes_by_instructor(client):
    response = client.get("/api/v1/classes?instructor=Taylor")
    assert response.status_code == 200
    classes = response.json()
    assert all("Taylor" in c["instructor_name"] for c in classes)


def test_get_class_by_id(client):
    classes = client.get("/api/v1/classes").json()
    first_class = classes[0]

    response = client.get(f"/api/v1/classes/{first_class['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == first_class["id"]
    assert data["title"] == first_class["title"]


def test_get_nonexistent_class(client):
    response = client.get("/api/v1/classes/nonexistent-id")
    assert response.status_code == 404
