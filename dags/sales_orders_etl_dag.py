"""Airflow DAG: sales_orders_etl_dag
Description: ETL pipeline to extract sales data from PostgreSQL raw_sales_orders, clean, and load into BigQuery dev_sales.fct_sales_orders_v1 partitioned by order_date
"""
import logging
from datetime import datetime, timedelta
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


def _log_pipeline_start(**context):
    logger.info("Starting pipeline execution for execution_date=%s", context.get("ds"))


def _run_sales_etl(**context):
    from server.pipeline.main import ETLPipelineRunner
    runner = ETLPipelineRunner()
    result = runner.run()
    if result.status != "COMPLETED":
        raise RuntimeError(f"ETL failed: {result.error_message}")
    logger.info(f"ETL completed successfully: {result.metrics.records_loaded} records loaded.")


def _log_pipeline_complete(**context):
    logger.info("Pipeline execution finished successfully for execution_date=%s", context.get("ds"))


with DAG(
    dag_id="sales_orders_etl_dag",
    default_args=default_args,
    description="ETL pipeline to extract sales data from PostgreSQL raw_sales_orders, clean, and load into BigQuery dev_sales.fct_sales_orders_v1 partitioned by order_date",
    schedule="@daily",
    catchup=False,
    tags=["sales", "postgresql", "bigquery", "etl"],
) as dag:

    start_task = PythonOperator(
        task_id="start_pipeline",
        python_callable=_log_pipeline_start,
    )

    etl_task = PythonOperator(
        task_id="run_sales_orders_etl",
        python_callable=_run_sales_etl,
    )

    end_task = PythonOperator(
        task_id="end_pipeline",
        python_callable=_log_pipeline_complete,
    )

    start_task >> etl_task >> end_task
