import argparse
import logging
import sys
import uuid
from typing import Optional
from fastapi import FastAPI
from server.config import settings
from server.extractor import extract_from_gcs
from server.transformer import transform_sales_data
from server.loader import load_to_bigquery
from server.models import ETLBatchMetrics

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("sales_etl_pipeline")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Daily Batch ETL Pipeline deployed as a Cloud Run Job",
    version="1.0.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.PROJECT_NAME}


@app.post("/run")
def trigger_pipeline():
    metrics = run_pipeline()
    return {"status": "success", "metrics": metrics.model_dump()}


def run_pipeline(
    gcs_uri: Optional[str] = None,
    project_id: Optional[str] = None,
    dataset_id: Optional[str] = None,
    table_id: Optional[str] = None,
    partition_field: Optional[str] = None,
    storage_client=None,
    bq_client=None,
) -> ETLBatchMetrics:
    """
    Orchestrate Extract, Transform, and Load steps for the Daily Sales Order Batch Pipeline.
    """
    source_uri = gcs_uri or settings.GCS_SOURCE_URI
    target_project = project_id or settings.GCP_PROJECT
    target_dataset = dataset_id or settings.BIGQUERY_DATASET
    target_table = table_id or settings.BIGQUERY_TABLE
    part_field = partition_field or settings.PARTITION_FIELD
    batch_id = str(uuid.uuid4())

    logger.info("==================================================")
    logger.info("Starting Daily Sales Order ETL Batch: %s", batch_id)
    logger.info("Source GCS URI: %s", source_uri)
    logger.info(
        "Target BigQuery: %s.%s.%s", target_project, target_dataset, target_table
    )
    logger.info("==================================================")

    # 1. EXTRACT
    raw_df = extract_from_gcs(source_uri, storage_client=storage_client)

    # 2. TRANSFORM & DEDUPLICATE
    clean_df, quarantined_df, metrics = transform_sales_data(raw_df, batch_id=batch_id)

    # 3. LOAD TO BIGQUERY
    if not clean_df.empty:
        try:
            loaded_count = load_to_bigquery(
                df=clean_df,
                project_id=target_project,
                dataset_id=target_dataset,
                table_id=target_table,
                partition_field=part_field,
                client=bq_client,
            )
            logger.info(
                "Successfully loaded %d records to BigQuery table.", loaded_count
            )
        except Exception as e:
            logger.error("Failed to load records into BigQuery: %s", e, exc_info=True)
            raise
    else:
        logger.info("No clean records to load into BigQuery.")

    logger.info("==================================================")
    logger.info("ETL Batch %s Completed Successfully", batch_id)
    logger.info("Metrics: %s", metrics.model_dump_json())
    logger.info("==================================================")

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Run Daily Batch Sales ETL Pipeline")
    parser.add_argument(
        "--gcs-uri", type=str, default=None, help="GCS Source URI for raw CSV"
    )
    parser.add_argument("--project", type=str, default=None, help="GCP Project ID")
    parser.add_argument("--dataset", type=str, default=None, help="BigQuery Dataset ID")
    parser.add_argument("--table", type=str, default=None, help="BigQuery Table ID")
    args = parser.parse_args()

    try:
        run_pipeline(
            gcs_uri=args.gcs_uri,
            project_id=args.project,
            dataset_id=args.dataset,
            table_id=args.table,
        )
        sys.exit(0)
    except Exception as e:
        logger.fatal("ETL Pipeline job failed: %s", e, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
