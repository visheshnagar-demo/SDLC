import pytest
import pandas as pd
from sqlalchemy import create_engine, text
from server.db_extractor import PostgresExtractor


@pytest.fixture
def test_source_engine():
    """Creates an in-memory SQLite engine simulating Cloud SQL PostgreSQL source table."""
    engine = create_engine("sqlite:///:memory:")
    with engine.connect() as conn:
        conn.execute(
            text(
                """
            CREATE TABLE test_data (
                id TEXT PRIMARY KEY,
                name TEXT,
                category TEXT,
                amount REAL,
                status TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        """
            )
        )
        conn.execute(
            text(
                """
            INSERT INTO test_data (id, name, category, amount, status, created_at, updated_at)
            VALUES 
                ('rec-1', '  Alpha item  ', 'tech', 150.50, 'active', '2026-01-01T10:00:00Z', '2026-01-01T10:00:00Z'),
                ('rec-2', 'Beta item', 'finance', 200.00, 'pending', '2026-01-02T12:00:00Z', '2026-01-02T12:00:00Z')
        """
            )
        )
        conn.commit()
    return engine


def test_postgres_extractor_extract(test_source_engine):
    extractor = PostgresExtractor(engine=test_source_engine, table_name="test_data")
    df = extractor.extract()

    assert isinstance(df, pd.DataFrame)
    assert len(df) == 2
    assert "id" in df.columns
    assert "name" in df.columns
    assert df.iloc[0]["id"] == "rec-1"


def test_postgres_extractor_discover_schema(test_source_engine):
    extractor = PostgresExtractor(engine=test_source_engine, table_name="test_data")
    schema = extractor.discover_schema()

    assert isinstance(schema, list)
    col_names = [col["name"] for col in schema]
    assert "id" in col_names
    assert "name" in col_names
    assert "category" in col_names


def test_postgres_extractor_retry_on_failure():
    bad_engine = create_engine("sqlite:////nonexistent/dir/bad.db")
    extractor = PostgresExtractor(engine=bad_engine, table_name="test_data")

    with pytest.raises(RuntimeError) as exc_info:
        extractor.extract(max_retries=2, retry_delay=0.01)

    assert "Failed to extract data" in str(exc_info.value)
