"""Unit tests for PostgreSQLExtractor."""
import pytest
from unittest.mock import patch, MagicMock

pd = pytest.importorskip("pandas")
sqlalchemy = pytest.importorskip("sqlalchemy")
pydantic = pytest.importorskip("pydantic")

from server.config import ETLConfig
from server.pipeline.extractor import PostgreSQLExtractor
from server.utils.exceptions import ExtractionError, ConfigurationError


def test_extractor_init():
    config = ETLConfig(
        POSTGRES_DB="testdb",
        POSTGRES_USER="testuser",
        SOURCE_TABLE="test_data",
    )
    extractor = PostgreSQLExtractor(config=config)
    assert extractor.config.source_table == "test_data"
    assert extractor.config.db_name == "testdb"


def test_create_engine_with_database_url():
    config = ETLConfig(
        DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
    )
    extractor = PostgreSQLExtractor(config=config)
    with patch("sqlalchemy.create_engine") as mock_create_engine:
        extractor.create_engine()
        mock_create_engine.assert_called_once_with("postgresql://user:pass@localhost:5432/dbname")


def test_create_engine_missing_config():
    config = ETLConfig(
        INSTANCE_CONNECTION_NAME="",
        POSTGRES_USER="",
        DATABASE_URL="",
        POSTGRES_HOST="",
    )
    extractor = PostgreSQLExtractor(config=config)
    with pytest.raises(ConfigurationError):
        extractor.create_engine()


def test_extract_records_success():
    config = ETLConfig(
        DATABASE_URL="postgresql://user:pass@localhost:5432/dbname",
        SOURCE_TABLE="test_data",
    )
    extractor = PostgreSQLExtractor(config=config)

    mock_df = pd.DataFrame({
        "id": [1, 2],
        "raw_text": ["sample1", "sample2"],
    })

    with patch.object(extractor, "create_engine") as mock_engine:
        mock_engine_instance = MagicMock()
        mock_engine.return_value = mock_engine_instance
        with patch("pandas.read_sql", return_value=mock_df) as mock_read_sql:
            df = extractor.extract()
            assert len(df) == 2
            mock_read_sql.assert_called_once_with("SELECT * FROM test_data", con=mock_engine_instance)
            mock_engine_instance.dispose.assert_called_once()


def test_extract_records_failure():
    config = ETLConfig(
        DATABASE_URL="postgresql://user:pass@localhost:5432/dbname",
        SOURCE_TABLE="test_data",
    )
    extractor = PostgreSQLExtractor(config=config)

    with patch.object(extractor, "create_engine") as mock_engine:
        mock_engine_instance = MagicMock()
        mock_engine.return_value = mock_engine_instance
        with patch("pandas.read_sql", side_effect=Exception("Database connection timeout")):
            with pytest.raises(ExtractionError):
                extractor.extract()
            mock_engine_instance.dispose.assert_called_once()
