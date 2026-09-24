"""Data extractor module for Cloud SQL PostgreSQL source."""
import logging
import pandas as pd
from config import PipelineConfig
from pipeline.db_connector import get_db_connection

logger = logging.getLogger("etl_pipeline.extractor")


def extract_data(cfg: PipelineConfig) -> pd.DataFrame:
    """Extracts data from the source table in Cloud SQL PostgreSQL."""
    logger.info("Extracting data from table '%s'...", cfg.source_table)
    engine, connector = get_db_connection(cfg)
    query = f"SELECT * FROM {cfg.source_table}"

    try:
        df = pd.read_sql(query, con=engine)
        logger.info("Successfully extracted %d records from '%s'.", len(df), cfg.source_table)
        return df
    except Exception as exc:
        logger.error("Failed to extract data from table '%s': %s", cfg.source_table, exc)
        raise RuntimeError(f"Data extraction failed: {exc}") from exc
    finally:
        if engine is not None:
            engine.dispose()
        if connector is not None:
            connector.close()
