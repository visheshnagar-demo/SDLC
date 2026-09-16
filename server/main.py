"""FastAPI application providing health checks and pipeline trigger endpoints."""
import os
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from server.models import PipelineRunResult
from server.pipeline.main import ETLPipelineRunner

app = FastAPI(
    title="Sales ETL Pipeline Service",
    version="1.0.0",
    description="Service for extracting sales data from PostgreSQL and loading to Google BigQuery",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "sales-etl-pipeline"}


@app.get("/api/v1/pipeline/info")
def get_pipeline_info():
    """Returns pipeline configuration information."""
    return {
        "pipeline_name": "postgres_to_bigquery_sales_etl",
        "source": {
            "type": "postgresql",
            "table": "raw_sales_orders",
        },
        "target": {
            "type": "bigquery",
            "table": f"{os.getenv('GCP_PROJECT_ID', 'upbeat-repeater-477110-q6')}.{os.getenv('BIGQUERY_DATASET', 'dev_sales')}.{os.getenv('BIGQUERY_TABLE', 'fct_sales_orders_v1')}",
            "partition_field": "order_date",
        },
    }


@app.post("/api/v1/pipeline/run", response_model=PipelineRunResult)
def trigger_pipeline_sync(source_table: str = "raw_sales_orders", dry_run: bool = False):
    """Trigger synchronous execution of ETL pipeline."""
    runner = ETLPipelineRunner()
    result = runner.run(source_table=source_table, dry_run=dry_run)
    if result.status != "COMPLETED":
        raise HTTPException(status_code=500, detail=result.error_message or "Pipeline execution failed")
    return result
