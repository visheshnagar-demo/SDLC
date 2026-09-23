# Sales ETL Pipeline (SCRUM-355)

Automated ETL pipeline designed to ingest raw sales CSV data from Google Cloud Storage, clean and normalize fields, and load into Google BigQuery with partitioning and clustering.

## Architecture

- **Source**: Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`)
- **Processing**: Python 3.11 with Pandas / PyArrow, packaged as a serverless Cloud Run Job.
- **Destination**: Google BigQuery (`sales_data.cleaned_sales`) partitioned by `created_at` (daily) and clustered by `product_category, customer_id`.
- **Orchestration**: Direct Cloud Run Job execution or Airflow DAG (`dags/sales_etl_dag.py`).

## Data Transformations

1. **Header & Column Standardization**: Standardize column names to lower_snake_case.
2. **Whitespace Stripping & Null Normalization**: Strip leading/trailing whitespaces, convert empty or literal null strings to `None`.
3. **Currency & Amount Cleansing**: Strip currency symbols (`$`, `€`, `£`), commas, and cast to `FLOAT64`.
4. **Order ID Cleansing & Deduplication**: Ensure integer typing and deduplicate transactions on natural key `order_id`.
5. **Timestamp Normalization**: Parse `created_at` into ISO 8601 UTC timestamp format.
6. **Audit Telemetry**: Inject `ingested_at` UTC timestamp.

## Project Structure

```
├── app.py                          # Application entry point
├── pipeline/
│   ├── run_sales_etl.py            # Standalone batch ETL pipeline runner
│   └── sales_etl_README.md         # Pipeline connector docs
├── schemas/
│   ├── cleaned_sales_schema.json   # BigQuery JSON table schema
│   └── sales_data_schema.json      # Sales data schema definition
├── sql/
│   └── ddl/
│       └── cleaned_sales.sql       # BigQuery DDL with partitioning & clustering
├── dags/
│   └── sales_etl_dag.py            # Airflow DAG definition
├── tests/
│   ├── test_sales_etl.py           # Unit & transformation tests
│   └── test_sales_etl_pipeline.py  # Pipeline configuration & syntax tests
├── transformation_spec.json        # Transformation mapping specification
├── env.deploy.json                 # Deployment environment variables
├── Dockerfile                      # Container definition for Cloud Run Job
├── requirements.txt                # Python dependencies
└── README.md                       # Documentation
```

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt
pip install pytest

# Run unit and integration tests
pytest tests/

# Execute pipeline locally
python -m pipeline.run_sales_etl
```

## Deployment

Deployable as a Cloud Run Job on Google Cloud Platform:

```bash
gcloud run jobs create sales-etl-job \
  --image gcr.io/upbeat-repeater-477110-q6/sales-etl:latest \
  --region us-central1 \
  --env-vars-file env.deploy.json
```
