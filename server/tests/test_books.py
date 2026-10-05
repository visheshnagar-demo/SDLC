from fastapi.testclient import TestClient


def test_create_book_success(client: TestClient):
    payload = {
        "isbn": "978-0132350884",
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "genre": "Software Engineering",
        "publication_year": 2008,
        "total_copies": 5,
    }
    response = client.post("/api/v1/books", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["isbn"] == payload["isbn"]
    assert data["title"] == payload["title"]
    assert data["author"] == payload["author"]
    assert data["genre"] == payload["genre"]
    assert data["publication_year"] == payload["publication_year"]
    assert data["total_copies"] == 5
    assert data["available_copies"] == 5
    assert "id" in data


def test_create_duplicate_isbn_conflict(client: TestClient):
    payload = {
        "isbn": "978-0201485677",
        "title": "Refactoring",
        "author": "Martin Fowler",
        "genre": "Software Engineering",
        "publication_year": 1999,
        "total_copies": 3,
    }
    res1 = client.post("/api/v1/books", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/books", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


def test_get_book_by_id(client: TestClient):
    payload = {
        "isbn": "978-0596007126",
        "title": "Head First Design Patterns",
        "author": "Eric Freeman",
        "genre": "Computer Science",
        "publication_year": 2004,
        "total_copies": 2,
    }
    create_res = client.post("/api/v1/books", json=payload)
    assert create_res.status_code == 201
    book_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/books/{book_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Head First Design Patterns"


def test_get_nonexistent_book_404(client: TestClient):
    res = client.get("/api/v1/books/nonexistent-uuid")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_list_books_search_and_filters(client: TestClient):
    b1 = {
        "isbn": "978-0001",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "genre": "Classic Fiction",
        "publication_year": 1925,
        "total_copies": 4,
    }
    b2 = {
        "isbn": "978-0002",
        "title": "1984",
        "author": "George Orwell",
        "genre": "Dystopian",
        "publication_year": 1949,
        "total_copies": 2,
    }
    client.post("/api/v1/books", json=b1)
    client.post("/api/v1/books", json=b2)

    # Search keyword
    res_search = client.get("/api/v1/books?search=Gatsby")
    assert res_search.status_code == 200
    items = res_search.json()
    assert any(b["title"] == "The Great Gatsby" for b in items)

    # Genre filter
    res_genre = client.get("/api/v1/books?genre=Dystopian")
    assert res_genre.status_code == 200
    genre_items = res_genre.json()
    assert all("Dystopian" in b["genre"] for b in genre_items)


def test_update_book(client: TestClient):
    payload = {
        "isbn": "978-0003",
        "title": "Original Title",
        "author": "Author A",
        "genre": "Drama",
        "publication_year": 2020,
        "total_copies": 3,
    }
    create_res = client.post("/api/v1/books", json=payload)
    book_id = create_res.json()["id"]

    update_payload = {"title": "Updated Title", "total_copies": 6}
    update_res = client.put(f"/api/v1/books/{book_id}", json=update_payload)
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["title"] == "Updated Title"
    assert data["total_copies"] == 6
    assert data["available_copies"] == 6


def test_delete_book_success(client: TestClient):
    payload = {
        "isbn": "978-0004",
        "title": "Book To Delete",
        "author": "Author B",
        "genre": "Mystery",
        "publication_year": 2021,
        "total_copies": 1,
    }
    create_res = client.post("/api/v1/books", json=payload)
    book_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/books/{book_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/v1/books/{book_id}")
    assert get_res.status_code == 404
