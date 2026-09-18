"""Apache Airflow DAG for SCRUM-322: GCS to BigQuery ETL Pipeline."""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from server.main import run_pipeline

default_args = {
    "owner": "data_engineer",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="scrum_322_gcs_to_bigquery_viswa",
    default_args=default_args,
    description="Extracts CSV from GCS, cleans data, and loads into BigQuery table upbeat-repeater-477110-q6.analytics.viswa",
    schedule_interval="@daily",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["etl", "bigquery", "gcs", "SCRUM-322"],
) as dag:

    execute_etl_task = PythonOperator(
        task_id="run_gcs_to_bigquery_etl",
        python_callable=run_pipeline,
    )
