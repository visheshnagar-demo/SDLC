"""Pipeline Orchestrator and entrypoint module."""
import argparse
import logging
import sys
import time
from server.config import PipelineConfig, get_config
from server.extractor import GCSSourceExtractor
from server.transformer import RankSortTransformer
from server.loader import BigQueryTargetLoader
from server.models import PipelineResult

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("server.pipeline")


def run_pipeline(config: PipelineConfig) -> PipelineResult:
    """Executes the end-to-end ETL workflow: Extract -> Transform -> Load."""
    start_time = time.time()
    logger.info("Starting ETL Pipeline execution for target table: %s", config.table_id)
    logger.info("Configuration: GCS URI=%s, Project=%s, Dataset=%s", config.source_gcs_uri, config.project_id, config.dataset_id)

    try:
        # Step 1: Extract
        extractor = GCSSourceExtractor(config)
        raw_df, extract_summary = extractor.extract()
        logger.info("Step 1 Complete: Extracted %d records", extract_summary.raw_row_count)

        # Step 2: Transform
        transformer = RankSortTransformer()
        transformed_df, transform_summary = transformer.transform(raw_df)
        logger.info("Step 2 Complete: Transformed and sorted %d records", transform_summary.transformed_row_count)

        # Step 3: Load
        loader = BigQueryTargetLoader(config)
        load_summary = loader.load(transformed_df)
        logger.info("Step 3 Complete: Loaded %d records into BigQuery job %s", load_summary.rows_loaded, load_summary.job_id)

        duration = time.time() - start_time
        result = PipelineResult(
            status="SUCCESS",
            extraction=extract_summary,
            transformation=transform_summary,
            load=load_summary,
            duration_seconds=round(duration, 2)
        )
        logger.info("Pipeline executed successfully in %.2f seconds.", duration)
        return result

    except Exception as exc:
        duration = time.time() - start_time
        logger.exception("Pipeline failed after %.2f seconds: %s", duration, str(exc))
        raise


def parse_args() -> PipelineConfig:
    """Parses command-line arguments to construct PipelineConfig."""
    parser = argparse.ArgumentParser(description="ETL Pipeline: GCS to BigQuery with Rank Sorting")
    parser.add_argument("--source-gcs-uri", type=str, default=None, help="GCS URI of the source CSV")
    parser.add_argument("--project-id", type=str, default=None, help="Target GCP Project ID")
    parser.add_argument("--dataset-id", type=str, default=None, help="Target BigQuery Dataset ID")
    parser.add_argument("--table-name", type=str, default=None, help="Target BigQuery Table ID")
    parser.add_argument("--write-disposition", type=str, default=None, help="BigQuery Write Disposition")

    args, _ = parser.parse_known_args()
    base_config = get_config()

    override_kwargs = {}
    if args.source_gcs_uri:
        override_kwargs["source_gcs_uri"] = args.source_gcs_uri
    if args.project_id:
        override_kwargs["project_id"] = args.project_id
    if args.dataset_id:
        override_kwargs["dataset_id"] = args.dataset_id
    if args.table_name:
        override_kwargs["table_id"] = args.table_name
    if args.write_disposition:
        override_kwargs["write_disposition"] = args.write_disposition

    return PipelineConfig(**{**base_config.model_dump(), **override_kwargs})


def main() -> None:
    """CLI Entry point."""
    try:
        config = parse_args()
        result = run_pipeline(config)
        print(f"ETL_RESULT: {result.model_dump_json(indent=2)}")
        sys.exit(0)
    except Exception as exc:
        print(f"ETL_ERROR: {str(exc)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
