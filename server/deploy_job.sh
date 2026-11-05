#!/usr/bin/env bash
set -euo pipefail

# Configuration
PROJECT_ID="${GCP_PROJECT:-upbeat-repeater-477110-q6}"
REGION="us-central1"
JOB_NAME="sales-order-etl-job"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${JOB_NAME}:latest"

echo "=== Deploying Cloud Run Job: ${JOB_NAME} ==="
echo "Project: ${PROJECT_ID}"
echo "Region:  ${REGION}"
echo "Image:   ${IMAGE_NAME}"

# Build and push container
docker build -t "${IMAGE_NAME}" .
docker push "${IMAGE_NAME}"

# Create or update Cloud Run Job
gcloud run jobs deploy "${JOB_NAME}" \
    --project="${PROJECT_ID}" \
    --image="${IMAGE_NAME}" \
    --region="${REGION}" \
    --tasks=1 \
    --max-retries=3 \
    --task-timeout=15m \
    --set-env-vars="GCP_PROJECT=${PROJECT_ID},BQ_DATASET=analytics,BQ_TABLE=new_sales_orders,GCS_SOURCE_URI=gs://sdlc-workspec-store/etl/data/raw_sales_data.csv"

echo "=== Cloud Run Job ${JOB_NAME} deployed successfully ==="
