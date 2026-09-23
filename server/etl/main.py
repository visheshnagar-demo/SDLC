"""CLI Entrypoint for Cloud Run ETL Job."""
import os
import sys
import argparse
import logging
import json
from server.etl.extractor import PostgresExtractor
from server.etl.cleaner import DataCleaner
from server.etl.loader import BigQueryLoader
from server.etl.pipeline import ETLPipeline

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("etl_main")


def main():
    parser = argparse.ArgumentParser(description="Cloud SQL PostgreSQL to BigQuery Batch ETL Runner")
    parser.add_argument("--source-table", default=os.getenv("SOURCE_TABLE", "test_data"), help="Source PostgreSQL table")
    parser.add_argument("--target-dataset", default=os.getenv("BQ_DATASET", "analytics"), help="Target BigQuery dataset")
    parser.add_argument("--target-table", default=os.getenv("BQ_TABLE", "postgres_test1"), help="Target BigQuery table")
    parser.add_argument("--write-disposition", default=os.getenv("WRITE_DISPOSITION", "WRITE_TRUNCATE"), help="BigQuery write disposition")
    args = parser.parse_args()

    logger.info("Starting Cloud Run Batch ETL Job with configuration: %s", vars(args))

    try:
        extractor = PostgresExtractor()
        cleaner = DataCleaner()
        loader = BigQueryLoader(
            dataset_id=args.target_dataset,
            table_id=args.target_table,
            write_disposition=args.write_disposition
        )
        pipeline = ETLPipeline(extractor=extractor, cleaner=cleaner, loader=loader)
        result = pipeline.run(source_table=args.source_table)
        print(json.dumps(result, indent=2))
        sys.exit(0)
    except Exception as e:
        logger.error("ETL Job encountered an unhandled fatal error: %s", str(e), exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
