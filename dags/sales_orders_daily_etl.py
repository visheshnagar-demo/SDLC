"""Airflow DAG: sales_orders_daily_etl
Cloud Composer / Airflow DAG for Daily Batch Sales Orders ETL pipeline.
Ingests sales data from GCS, cleans/deduplicates records, and loads into BigQuery analytics.sales_orders.
"""
from datetime import datetime, timedelta
import logging

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator

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


def _run_batch_etl(**context):
    """Executes the Sales Orders Batch ETL pipeline."""
    from server.main import ETLRunner

    ds = context.get("ds")
    logger.info("Executing Sales Orders Batch ETL for execution_date: %s", ds)

    runner = ETLRunner(
        source_uri="gs://sdlc-workspec-store/etl/data/raw_sales_data.csv",
        project_id="upbeat-repeater-477110-q6",
        dataset_id="analytics",
        table_id="sales_orders",
        location="us-central1",
    )
    result = runner.run()
    logger.info("ETL Run Result: %s", result)
    return result


with DAG(
    dag_id="sales_orders_daily_etl",
    default_args=default_args,
    description="Daily batch sales orders ETL from GCS into partitioned BigQuery table analytics.sales_orders",
    schedule_interval="@daily",
    catchup=False,
    tags=["sales", "etl", "bigquery", "gcs", "cloud-run-job"],
) as dag:

    execute_etl = PythonOperator(
        task_id="execute_sales_orders_etl",
        python_callable=_run_batch_etl,
        provide_context=True,
    )

    execute_etl
