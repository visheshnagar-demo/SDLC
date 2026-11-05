#!/usr/bin/env bash
# Deploy Daily Sales Batch ETL Pipeline as a GCP Cloud Run Job
set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-upbeat-repeater-477110-q6}"
REGION="${GCP_REGION:-us-central1}"
IMAGE_NAME="${GAR_IMAGE:-us-central1-docker.pkg.dev/${PROJECT_ID}/sdlc-containers/sales-etl-job:latest}"
JOB_NAME="daily-sales-etl-job"

echo "=========================================================="
echo "Deploying Cloud Run Job: ${JOB_NAME}"
echo "Project: ${PROJECT_ID} | Region: ${REGION}"
echo "Image: ${IMAGE_NAME}"
echo "=========================================================="

# 1. Build and push container to Google Artifact Registry
gcloud builds submit --tag "${IMAGE_NAME}" .

# 2. Deploy Cloud Run Job
gcloud run jobs deploy "${JOB_NAME}" \
  --image "${IMAGE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --tasks 1 \
  --max-retries 1 \
  --task-timeout 600s \
  --cpu 2 \
  --memory 4Gi \
  --set-env-vars "GCP_PROJECT=${PROJECT_ID},GCS_SOURCE_URI=gs://sdlc-workspec-store/etl/data/raw_sales_data.csv,BIGQUERY_DATASET=analytics,BIGQUERY_TABLE=new_sales_orders"

echo "Cloud Run Job ${JOB_NAME} deployed successfully."
