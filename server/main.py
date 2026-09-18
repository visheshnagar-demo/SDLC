"""CLI / Cloud Run Job entrypoint for SCRUM-322 ETL Pipeline."""

import sys
from server.config import config
from server.pipeline.extract import extract_from_gcs
from server.pipeline.transform import transform_data
from server.pipeline.load import load_to_bigquery
from server.pipeline.observability import PipelineMetrics, structured_logger


def run_pipeline() -> PipelineMetrics:
    """
    Executes the full ETL pipeline:
    1. Extracts raw CSV from GCS
    2. Normalizes, cleans, and transforms schema
    3. Loads verified data into BigQuery
    """
    metrics = PipelineMetrics(
        source_uri=config.gcs_source_uri,
        target_table=config.full_target_table_id,
    )

    structured_logger.info(
        "Starting ETL Pipeline execution",
        {
            "run_id": metrics.run_id,
            "source_uri": config.gcs_source_uri,
            "target_table": config.full_target_table_id,
            "write_disposition": config.write_disposition,
        },
    )

    try:
        # Step 1: Extraction
        raw_df = extract_from_gcs(config.gcs_source_uri)
        metrics.rows_extracted = len(raw_df)

        # Step 2: Transformation
        clean_df = transform_data(
            raw_df,
            max_error_ratio=config.circuit_breaker_max_error_ratio,
        )
        metrics.rows_transformed = len(clean_df)

        # Step 3: Load into BigQuery
        load_result = load_to_bigquery(
            df=clean_df,
            project_id=config.bq_project_id,
            dataset_id=config.bq_dataset_id,
            table_id=config.bq_table_id,
            write_disposition=config.write_disposition,
            location=config.bq_location,
        )
        metrics.rows_loaded = load_result.get("rows_loaded", len(clean_df))
        metrics.finish(status="SUCCESS")

        structured_logger.info(
            "ETL Pipeline completed successfully",
            {"metrics": metrics.to_dict()},
        )
        return metrics

    except Exception as exc:
        metrics.finish(status="FAILED", error_message=str(exc))
        structured_logger.error(
            f"ETL Pipeline execution failed: {str(exc)}",
            {"metrics": metrics.to_dict()},
            exc_info=True,
        )
        raise


if __name__ == "__main__":
    try:
        run_pipeline()
        sys.exit(0)
    except Exception:
        sys.exit(1)
