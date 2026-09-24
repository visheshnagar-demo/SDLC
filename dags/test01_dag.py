"""Airflow DAG: test01_dag
Automated ETL pipeline to extract CSV from GCS, transform data, and load to BigQuery table test01.
"""
from datetime import datetime, timedelta
import logging
import os

from airflow import DAG
from airflow.operators.python import PythonOperator

logger = logging.getLogger(__name__)

default_args = {
    "owner": "data-engineering",
    "depends_on_past": False,
    "start_date": datetime(2025, 1, 1),
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}


def _execute_etl(**context):
    """Invokes the ETL pipeline runner."""
    from server.main import run_etl

    source_uri = os.getenv("SOURCE_GCS_URI", "gs://sdlc-workspec-store/etl/data/my_file (1).csv")
    project_id = os.getenv("GCP_PROJECT", "upbeat-repeater-477110-q6")
    dataset_id = os.getenv("BIGQUERY_DATASET", "analytics")
    table_id = os.getenv("BIGQUERY_TABLE", "test01")
    write_disposition = os.getenv("WRITE_DISPOSITION", "WRITE_TRUNCATE")

    logger.info("Starting ETL execution from Airflow: source=%s, target=%s.%s.%s", source_uri, project_id, dataset_id, table_id)
    summary = run_etl(
        source_uri=source_uri,
        project_id=project_id,
        dataset_id=dataset_id,
        table_id=table_id,
        write_disposition=write_disposition,
    )
    logger.info("ETL finished with summary: %s", summary)
    return summary


with DAG(
    dag_id="test01_dag",
    default_args=default_args,
    description="Automated ETL pipeline to extract CSV from GCS and load to BigQuery table test01",
    schedule_interval="@daily",
    catchup=False,
    tags=["etl", "gcs", "bigquery", "analytics"],
) as dag:

    run_etl_task = PythonOperator(
        task_id="run_test01_etl",
        python_callable=_execute_etl,
        provide_context=True,
    )
