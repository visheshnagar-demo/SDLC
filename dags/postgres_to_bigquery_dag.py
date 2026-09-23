"""Airflow DAG: postgres_to_bigquery_dag
Description: Extract data from Cloud SQL PostgreSQL and load to BigQuery analytics.postgres_test2
"""
from datetime import datetime, timedelta
import logging
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


def _execute_etl_pipeline(**context):
    from server.etl.pipeline import ETLPipeline
    pipeline = ETLPipeline()
    metrics = pipeline.run()
    logger.info("Pipeline completed: %s", metrics.to_dict())
    return metrics.to_dict()


with DAG(
    dag_id="postgres_to_bigquery_dag",
    default_args=default_args,
    description="Extract data from Cloud SQL PostgreSQL and load to BigQuery analytics.postgres_test2",
    schedule_interval="@daily",
    catchup=False,
    tags=["etl", "cloud_sql", "bigquery", "postgres_test2"],
) as dag:

    run_etl = PythonOperator(
        task_id="run_postgres_to_bigquery_etl",
        python_callable=_execute_etl_pipeline,
        provide_context=True,
    )
