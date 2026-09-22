FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Cloud Run Job: runs the pipeline script directly, exits on completion.
# No HTTP port exposed — this is a batch Job, not a Service.
CMD ["python", "-m", "pipeline.run_postgres_to_bq_test4"]
