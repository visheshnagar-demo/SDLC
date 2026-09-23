"""Unit tests for SchemaValidator and Circuit Breaker."""
import ast
import os
import pytest


def test_validator_file_syntax():
    file_path = os.path.join("server", "validator.py")
    assert os.path.isfile(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None


def test_normalize_headers():
    pd = pytest.importorskip("pandas")
    from server.validator import SchemaValidator
    df = pd.DataFrame({"Order ID": [1], "Customer  Name ": ["Alice"], "Created-At": ["2026-09-01"]})
    norm = SchemaValidator.normalize_headers(df)
    assert list(norm.columns) == ["order_id", "customer_name", "created_at"]


def test_validator_missing_required_column():
    pd = pytest.importorskip("pandas")
    from server.validator import SchemaValidator
    df = pd.DataFrame({"order_id": [1], "customer_id": ["CUST-1"]})
    validator = SchemaValidator(error_threshold=0.20)
    with pytest.raises(ValueError, match="missing mandatory columns"):
        validator.validate(df)


def test_validator_circuit_breaker_triggered():
    pd = pytest.importorskip("pandas")
    from server.validator import SchemaValidator
    data = {
        "order_id": [1001, None, None, None],
        "customer_id": ["C1", "C2", None, "C4"],
        "created_at": ["2026-09-01T10:00:00Z", None, "2026-09-01T11:00:00Z", None],
    }
    df = pd.DataFrame(data)
    validator = SchemaValidator(error_threshold=0.20)
    with pytest.raises(ValueError, match="Circuit breaker tripped"):
        validator.validate(df)


def test_validator_success_with_minor_quarantine():
    pd = pytest.importorskip("pandas")
    from server.validator import SchemaValidator
    data = {
        "order_id": [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, None],
        "customer_id": [f"C{i}" for i in range(1, 11)],
        "created_at": ["2026-09-01T10:00:00Z"] * 10,
    }
    df = pd.DataFrame(data)
    validator = SchemaValidator(error_threshold=0.20)
    valid_df, quarantined_df = validator.validate(df)
    assert len(valid_df) == 9
    assert len(quarantined_df) == 1
