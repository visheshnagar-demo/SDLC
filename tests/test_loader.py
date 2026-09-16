from datetime import datetime, timezone
import pytest
from server.pipeline.loader import BigQueryLoader
from server.pipeline.transformer import DataTransformer


def test_loader_initialization():
    loader = BigQueryLoader(project_id="test-proj", dataset_id="test_ds", table_id="fct_sales_orders")
    assert loader.project_id == "test-proj"
    assert loader.dataset_id == "test_ds"
    assert loader.table_id == "fct_sales_orders"
    assert loader.full_table_ref == "test-proj.test_ds.fct_sales_orders"


def test_loader_load_records_simulated():
    loader = BigQueryLoader(project_id="test-proj", dataset_id="test_ds", table_id="fct_sales_orders")
    loader.is_mock = True

    records = [
        {
            "order_id": "ord_001",
            "customer_id": "cust_10",
            "customer_email": "test@example.com",
            "order_date": "2026-05-18",
            "amount": 100.0,
            "currency": "USD",
            "status": "completed",
            "source_created_at": datetime.now(timezone.utc).isoformat(),
            "ingested_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    count = loader.load_records(records)
    assert count == 1


def test_loader_load_empty_records():
    loader = BigQueryLoader()
    loader.is_mock = True
    count = loader.load_records([])
    assert count == 0


def test_loader_check_connection():
    loader = BigQueryLoader()
    loader.is_mock = True
    assert loader.check_connection() is True
