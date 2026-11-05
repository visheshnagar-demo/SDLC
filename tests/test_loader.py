"""Unit tests for the BigQuery Partitioned Table Loader."""

from unittest.mock import MagicMock
from datetime import datetime, timezone
import pandas as pd
from server.loader import Loader, get_bigquery_schema


def test_get_bigquery_schema():
    """Verify BigQuery schema fields match expected specification."""
    schema = get_bigquery_schema()
    field_names = [f.name for f in schema]
    assert "order_id" in field_names
    assert "customer_id" in field_names
    assert "product_id" in field_names
    assert "quantity" in field_names
    assert "unit_price" in field_names
    assert "total_amount" in field_names
    assert "created_at" in field_names
    assert "ingested_at" in field_names
    assert "batch_id" in field_names


def test_loader_empty_dataframe():
    """Verify loader skips empty DataFrame and returns 0."""
    mock_bq_client = MagicMock()
    loader = Loader(bq_client=mock_bq_client)

    loaded = loader.load_records(
        pd.DataFrame(), destination_table_id="analytics.new_sales_orders"
    )
    assert loaded == 0
    mock_bq_client.load_table_from_dataframe.assert_not_called()


def test_loader_success():
    """AC: Partitioned BigQuery Loading - Load clean records into BigQuery."""
    mock_bq_client = MagicMock()
    mock_job = MagicMock()
    mock_job.job_id = "job_test_12345"
    mock_job.result.return_value = None
    mock_bq_client.load_table_from_dataframe.return_value = mock_job

    df_clean = pd.DataFrame(
        [
            {
                "order_id": "ORD-1",
                "customer_id": "CUST-1",
                "product_id": "PROD-1",
                "product_category": "Apparel",
                "quantity": 2,
                "unit_price": 25.0,
                "total_amount": 50.0,
                "order_status": "COMPLETED",
                "created_at": datetime(2026, 5, 18, 12, 0, tzinfo=timezone.utc),
                "ingested_at": datetime(2026, 5, 18, 12, 5, tzinfo=timezone.utc),
                "batch_id": "batch-1",
            }
        ]
    )

    loader = Loader(bq_client=mock_bq_client)
    loaded_count = loader.load_records(
        df_clean, destination_table_id="analytics.new_sales_orders"
    )

    assert loaded_count == 1
    mock_bq_client.load_table_from_dataframe.assert_called_once()
    args, kwargs = mock_bq_client.load_table_from_dataframe.call_args
    job_config = kwargs.get("job_config")
    assert job_config is not None
    assert job_config.time_partitioning.field == "created_at"
