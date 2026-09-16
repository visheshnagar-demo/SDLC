"""ETL Pipeline Runner orchestrating extraction, cleansing, and loading."""
import argparse
import json
import logging
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Optional
from server.pipeline.cleanser import SalesDataCleanser
from server.pipeline.extractor import PostgresExtractor
from server.pipeline.loader import BigQueryLoader
from server.pipeline.quarantine import QuarantineManager
from server.models import PipelineRunResult

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sales_etl_pipeline")


class ETLPipelineRunner:
    """End-to-end pipeline orchestrator for Sales Order ETL."""

    def __init__(
        self,
        db_url: Optional[str] = None,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
        table_id: Optional[str] = None,
        extractor: Optional[PostgresExtractor] = None,
        cleanser: Optional[SalesDataCleanser] = None,
        quarantine_mgr: Optional[QuarantineManager] = None,
        loader: Optional[BigQueryLoader] = None,
    ):
        self.db_url = db_url or os.getenv("POSTGRES_DB_URL") or os.getenv("DATABASE_URL")
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID", "upbeat-repeater-477110-q6")
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET", "dev_sales")
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE", "fct_sales_orders_v1")

        self.extractor = extractor or PostgresExtractor(db_url=self.db_url)
        self.cleanser = cleanser or SalesDataCleanser()
        self.quarantine_mgr = quarantine_mgr or QuarantineManager()
        self.loader = loader or BigQueryLoader(
            project_id=self.project_id,
            dataset_id=self.dataset_id,
            table_id=self.table_id,
        )

    def run(
        self,
        source_table: str = "raw_sales_orders",
        batch_size: Optional[int] = None,
        dry_run: bool = False,
    ) -> PipelineRunResult:
        """Execute complete ETL run."""
        run_id = f"run-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}"
        start_time_dt = datetime.now(timezone.utc)
        start_time_iso = start_time_dt.isoformat()
        t0 = time.time()

        logger.info(f"=== Starting ETL Pipeline Run '{run_id}' ===")
        logger.info(f"Source: PostgreSQL [{source_table}] -> Target: BigQuery [{self.project_id}.{self.dataset_id}.{self.table_id}]")

        try:
            # 1. Extraction
            raw_records = self.extractor.extract(table_name=source_table, batch_size=batch_size)
            extracted_count = len(raw_records)

            # 2. Cleansing & Validation
            clean_records, quarantined_records = self.cleanser.process_batch(raw_records)
            self.quarantine_mgr.record_batch(quarantined_records)

            # 3. Loading
            affected_partitions = []
            records_loaded = 0
            if not dry_run:
                load_res = self.loader.load_records(clean_records)
                records_loaded = load_res.get("records_loaded", 0)
                affected_partitions = load_res.get("affected_partitions", [])
            else:
                logger.info(f"Dry-run mode enabled: skipped loading {len(clean_records)} records.")
                records_loaded = len(clean_records)
                affected_partitions = sorted(list({r.order_date.isoformat() for r in clean_records}))

            # 4. Metrics & Quarantine Audit
            metrics = self.quarantine_mgr.compute_metrics(
                extracted_count=extracted_count,
                valid_count=len(clean_records),
                loaded_count=records_loaded,
            )
            self.quarantine_mgr.log_quarantine_summary()

            end_time_dt = datetime.now(timezone.utc)
            duration = round(time.time() - t0, 2)

            result = PipelineRunResult(
                pipeline_name="postgres_to_bigquery_sales_etl",
                run_id=run_id,
                status="COMPLETED",
                start_time=start_time_iso,
                end_time=end_time_dt.isoformat(),
                duration_seconds=duration,
                metrics=metrics,
                target_partitions_affected=affected_partitions,
            )

            logger.info(f"=== ETL Pipeline Run Completed Successfully in {duration}s ===")
            logger.info(f"Result: {json.dumps(result.model_dump(), indent=2)}")
            return result

        except Exception as exc:
            duration = round(time.time() - t0, 2)
            end_time_dt = datetime.now(timezone.utc)
            logger.exception(f"ETL Pipeline Run '{run_id}' FAILED: {exc}")

            metrics = self.quarantine_mgr.compute_metrics(
                extracted_count=0,
                valid_count=0,
                loaded_count=0,
            )

            return PipelineRunResult(
                pipeline_name="postgres_to_bigquery_sales_etl",
                run_id=run_id,
                status="FAILED",
                start_time=start_time_iso,
                end_time=end_time_dt.isoformat(),
                duration_seconds=duration,
                metrics=metrics,
                target_partitions_affected=[],
                error_message=str(exc),
            )


def cli_main():
    """CLI Entry point for direct or container invocation."""
    parser = argparse.ArgumentParser(description="Sales Order PostgreSQL -> BigQuery ETL Pipeline")
    parser.add_argument("--source-table", default="raw_sales_orders", help="Source PostgreSQL table name")
    parser.add_argument("--dataset", default=None, help="Target BigQuery dataset name")
    parser.add_argument("--table", default=None, help="Target BigQuery table name")
    parser.add_argument("--batch-size", type=int, default=None, help="Extraction batch limit")
    parser.add_argument("--dry-run", action="store_true", help="Execute without loading to BigQuery")

    args = parser.parse_args()

    runner = ETLPipelineRunner(
        dataset_id=args.dataset,
        table_id=args.table,
    )
    result = runner.run(
        source_table=args.source_table,
        batch_size=args.batch_size,
        dry_run=args.dry_run,
    )

    if result.status != "COMPLETED":
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    cli_main()
