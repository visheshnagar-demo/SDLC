from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from server.models.loan import Loan


def test_checkout_and_return_workflow(client: TestClient):
    # 1. Create a book
    book_payload = {
        "isbn": "978-0140449136",
        "title": "Crime and Punishment",
        "author": "Fyodor Dostoevsky",
        "genre": "Classic",
        "publication_year": 1866,
        "total_copies": 2,
    }
    book_res = client.post("/api/v1/books", json=book_payload)
    assert book_res.status_code == 201
    book_id = book_res.json()["id"]

    # 2. Create a patron
    patron_payload = {
        "full_name": "Rodion Raskolnikov",
        "email": "raskolnikov@example.com",
        "phone_number": "555-0188",
    }
    patron_res = client.post("/api/v1/patrons", json=patron_payload)
    assert patron_res.status_code == 201
    patron_id = patron_res.json()["id"]

    # 3. Checkout book
    checkout_payload = {"patron_id": patron_id, "book_id": book_id}
    loan_res = client.post("/api/v1/loans/checkout", json=checkout_payload)
    assert loan_res.status_code == 201
    loan_data = loan_res.json()
    loan_id = loan_data["id"]
    assert loan_data["status"] == "ACTIVE"
    assert loan_data["fine_amount"] == 0.0

    # Verify book stock decremented
    book_check = client.get(f"/api/v1/books/{book_id}")
    assert book_check.json()["available_copies"] == 1

    # 4. Return book
    return_res = client.post(f"/api/v1/loans/{loan_id}/return")
    assert return_res.status_code == 200
    return_data = return_res.json()
    assert return_data["status"] == "RETURNED"
    assert return_data["return_date"] is not None

    # Verify book stock incremented
    book_check_after = client.get(f"/api/v1/books/{book_id}")
    assert book_check_after.json()["available_copies"] == 2


def test_checkout_out_of_stock_fails(client: TestClient):
    book_payload = {
        "isbn": "978-0140449137",
        "title": "The Idiot",
        "author": "Fyodor Dostoevsky",
        "genre": "Classic",
        "publication_year": 1869,
        "total_copies": 1,
    }
    book_id = client.post("/api/v1/books", json=book_payload).json()["id"]

    patron_payload = {"full_name": "Prince Myshkin", "email": "myshkin@example.com"}
    patron_id = client.post("/api/v1/patrons", json=patron_payload).json()["id"]

    # First checkout takes the only copy
    res1 = client.post(
        "/api/v1/loans/checkout", json={"patron_id": patron_id, "book_id": book_id}
    )
    assert res1.status_code == 201

    # Second checkout fails (out of stock)
    res2 = client.post(
        "/api/v1/loans/checkout", json={"patron_id": patron_id, "book_id": book_id}
    )
    assert res2.status_code == 400
    assert "No available copies" in res2.json()["detail"]


def test_checkout_borrowing_limit_exceeded(client: TestClient):
    # Patron with limit 5
    patron_id = client.post(
        "/api/v1/patrons",
        json={"full_name": "Avid Reader", "email": "reader@example.com"},
    ).json()["id"]

    # Create 6 books
    book_ids = []
    for i in range(6):
        b = client.post(
            "/api/v1/books",
            json={
                "isbn": f"978-00000000{i}",
                "title": f"Book Number {i}",
                "author": "Author X",
                "genre": "General",
                "publication_year": 2020,
                "total_copies": 5,
            },
        ).json()
        book_ids.append(b["id"])

    # Borrow 5 books successfully
    for i in range(5):
        res = client.post(
            "/api/v1/loans/checkout",
            json={"patron_id": patron_id, "book_id": book_ids[i]},
        )
        assert res.status_code == 201

    # 6th checkout must fail with 400
    res_6th = client.post(
        "/api/v1/loans/checkout", json={"patron_id": patron_id, "book_id": book_ids[5]}
    )
    assert res_6th.status_code == 400
    assert "maximum borrowing limit" in res_6th.json()["detail"].lower()


def test_overdue_fine_calculation(client: TestClient, db_session: Session):
    book_id = client.post(
        "/api/v1/books",
        json={
            "isbn": "978-0345391803",
            "title": "The Hitchhiker's Guide to the Galaxy",
            "author": "Douglas Adams",
            "genre": "Sci-Fi",
            "publication_year": 1979,
            "total_copies": 2,
        },
    ).json()["id"]

    patron_id = client.post(
        "/api/v1/patrons",
        json={"full_name": "Ford Prefect", "email": "ford.p@example.com"},
    ).json()["id"]

    loan_res = client.post(
        "/api/v1/loans/checkout", json={"patron_id": patron_id, "book_id": book_id}
    )
    loan_id = loan_res.json()["id"]

    # Manually backdate due_date by 3 days in DB
    loan = db_session.query(Loan).filter(Loan.id == loan_id).first()
    assert loan is not None
    loan.due_date = datetime.now(timezone.utc) - timedelta(days=3)
    db_session.commit()

    # Now return book -> 3 days overdue * $0.50 = $1.50 fine
    return_res = client.post(f"/api/v1/loans/{loan_id}/return")
    assert return_res.status_code == 200
    loan_data = return_res.json()
    assert loan_data["fine_amount"] == 1.50

    # Patron fine balance updated
    patron_res = client.get(f"/api/v1/patrons/{patron_id}")
    assert patron_res.json()["total_fines_due"] == 1.50


def test_get_overdue_loans(client: TestClient, db_session: Session):
    book_id = client.post(
        "/api/v1/books",
        json={
            "isbn": "978-0441172719",
            "title": "Dune",
            "author": "Frank Herbert",
            "genre": "Sci-Fi",
            "publication_year": 1965,
            "total_copies": 1,
        },
    ).json()["id"]

    patron_id = client.post(
        "/api/v1/patrons",
        json={"full_name": "Paul Atreides", "email": "paul@arrakis.com"},
    ).json()["id"]

    loan_id = client.post(
        "/api/v1/loans/checkout", json={"patron_id": patron_id, "book_id": book_id}
    ).json()["id"]

    # Backdate due_date
    loan = db_session.query(Loan).filter(Loan.id == loan_id).first()
    assert loan is not None
    loan.due_date = datetime.now(timezone.utc) - timedelta(days=2)
    db_session.commit()

    overdue_res = client.get("/api/v1/loans/overdue")
    assert overdue_res.status_code == 200
    items = overdue_res.json()
    assert any(item["id"] == loan_id for item in items)


def test_list_loans_filters(client: TestClient):
    book_res = client.post(
        "/api/v1/books",
        json={
            "isbn": "978-0385547345",
            "title": "The Lincoln Highway",
            "author": "Amor Towles",
            "genre": "Fiction",
            "publication_year": 2021,
            "total_copies": 3,
        },
    )
    book_id = book_res.json()["id"]

    patron_res = client.post(
        "/api/v1/patrons",
        json={"full_name": "Emmett Watson", "email": "emmett@example.com"},
    )
    patron_id = patron_res.json()["id"]

    checkout_res = client.post(
        "/api/v1/loans/checkout", json={"patron_id": patron_id, "book_id": book_id}
    )
    loan_id = checkout_res.json()["id"]

    # Filter by patron_id
    list_res = client.get(f"/api/v1/loans?patron_id={patron_id}")
    assert list_res.status_code == 200
    assert any(l["id"] == loan_id for l in list_res.json())

    # Filter by status
    status_res = client.get("/api/v1/loans?status=ACTIVE")
    assert status_res.status_code == 200
    assert any(l["id"] == loan_id for l in status_res.json())
