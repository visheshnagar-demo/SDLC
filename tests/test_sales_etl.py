"""Unit and transformation tests for Sales ETL pipeline."""
import os
import json
import pytest

def test_schema_json_and_ddl_exist():
    """Verifies that target schema definitions exist and have all required fields."""
    schema_path = os.path.join("schemas", "aarchi_gcs_test1_schema.json")
    assert os.path.isfile(schema_path), f"Schema file not found at {schema_path}"

    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    field_names = {field["name"] for field in schema}
    expected_fields = {
        "order_id",
        "customer_id",
        "customer_name",
        "customer_email",
        "product_category",
        "amount",
        "currency",
        "order_status",
        "created_at",
        "order_date",
        "ingestion_timestamp",
        "etl_batch_id",
    }
    assert expected_fields.issubset(field_names)

    ddl_path = os.path.join("sql", "ddl", "aarchi_gcs_test1.sql")
    assert os.path.isfile(ddl_path), f"DDL file not found at {ddl_path}"
    with open(ddl_path, "r", encoding="utf-8") as f:
        ddl_content = f.read()
    assert "aarchi_gcs_test1" in ddl_content
    assert "PARTITION BY" in ddl_content
    assert "order_date" in ddl_content


def test_sales_schema_json_exists():
    """Verifies that sales_schema.json exists and is valid."""
    schema_path = os.path.join("schemas", "sales_schema.json")
    assert os.path.isfile(schema_path), f"Schema file not found at {schema_path}"
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    assert len(schema) >= 10


def test_transformation_spec_coverage():
    """Verifies transformation_spec.json maps all source columns to target."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path), f"Transformation spec missing at {spec_path}"
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)

    mapped_source_cols = {m["source_column"] for m in spec.get("mappings", [])}
    for col in spec.get("source_columns", []):
        assert col in mapped_source_cols, f"Source column {col} unmapped in transformation_spec"


def test_transformer_logic():
    """Tests transformer data cleaning and deduplication if pandas is available."""
    pd = pytest.importorskip("pandas")
    from pipeline.transformer import SalesDataTransformer

    data = [
        {
            "order_id": 1001,
            "customer_id": " CUST-201 ",
            "customer_name": " Alice Johnson ",
            "customer_email": "alice.j@example.com",
            "product_category": "Electronics",
            "amount": "$299.99",
            "currency": "usd",
            "order_status": "completed",
            "created_at": "2026-09-01T10:14:22Z",
        },
        {
            "order_id": 1002,
            "customer_id": "CUST-202",
            "customer_name": "Bob Smith",
            "customer_email": "NULL",
            "product_category": "Home & Kitchen",
            "amount": 49.50,
            "currency": "USD",
            "order_status": "COMPLETED",
            "created_at": "2026-09-01T11:05:10Z",
        },
        {
            "order_id": 1001,  # Duplicate of 1001, updated status
            "customer_id": "CUST-201",
            "customer_name": "Alice Johnson",
            "customer_email": "alice.j@example.com",
            "product_category": "Electronics",
            "amount": "299.99",
            "currency": "USD",
            "order_status": "REFUNDED",
            "created_at": "2026-09-01T14:00:00Z",
        },
        {
            "order_id": 1003,
            "customer_id": "CUST-203",
            "customer_name": "Carlos Rivera",
            "customer_email": None,
            "product_category": "None",
            "amount": "15.20",
            "currency": "USD",
            "order_status": "PENDING",
            "created_at": "2026-09-01T11:45:00Z",
        },
    ]
    raw_df = pd.DataFrame(data)
    transformer = SalesDataTransformer(batch_id="test-batch-123")
    df_clean, metrics = transformer.transform(raw_df)

    assert len(df_clean) == 3
    assert metrics["rows_extracted"] == 4
    assert metrics["rows_cleaned"] == 4
    assert metrics["rows_deduplicated"] == 3
    assert metrics["duplicates_removed"] == 1

    # Verify latest record retained for order_id 1001
    row_1001 = df_clean[df_clean["order_id"] == 1001].iloc[0]
    assert row_1001["order_status"] == "REFUNDED"
    assert row_1001["customer_id"] == "CUST-201"

    # Verify string cleaning and null normalization (using pd.isna)
    row_1002 = df_clean[df_clean["order_id"] == 1002].iloc[0]
    assert pd.isna(row_1002["customer_email"])

    row_1003 = df_clean[df_clean["order_id"] == 1003].iloc[0]
    assert pd.isna(row_1003["customer_email"])
    assert pd.isna(row_1003["product_category"])

    # Verify numeric coercion
    assert row_1001["amount"] == 299.99
    assert row_1002["amount"] == 49.50


def test_transformer_circuit_breaker():
    """Tests transformer fail-fast when input data is empty."""
    pd = pytest.importorskip("pandas")
    from pipeline.transformer import SalesDataTransformer
    transformer = SalesDataTransformer()
    with pytest.raises(ValueError):
        transformer.transform(pd.DataFrame())
