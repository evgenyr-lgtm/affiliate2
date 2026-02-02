#!/bin/bash

set -e


PROJECT_ID="af-affiliate-portal"

# Add gcloud to PATH
export PATH="/Users/evgenyrodionov/Downloads/google-cloud-sdk/bin:$PATH"

REGION="us-east4"
SERVICE_NAME="affiliate-backend"
INSTANCE_CONNECTION_NAME="af-affiliate-portal:us-east4:af-affiliate-portal-instance"
DATABASE_NAME="af-affiliate-portal-database"
DB_USER="Evgeny92"
DB_PASSWORD_URLENCODED="qX75nJe%40lsgbid%5DU"

JWT_SECRET="bd1cdc433c66e2cc93b51f39d1f49593959e6526e705d93d7bd1df1297912f28"
JWT_REFRESH_SECRET="ceae86f2ca1718cb22029c92eb7c3dfa2277b27eef61c40d17b7e4461df29542"

FRONTEND_URL="https://afl4--af-affiliate-portal.us-east4.hosted.app"
GCS_BUCKET="af-affiliate-portal-uploads"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is not installed. Install it first:"
  echo "  https://cloud.google.com/sdk/docs/install"
  exit 1
fi

echo "Deploying backend to Cloud Run..."

gcloud run deploy "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --source . \
  --quiet \
  --allow-unauthenticated \
  --add-cloudsql-instances "${INSTANCE_CONNECTION_NAME}" \
  --set-env-vars "NODE_ENV=production,FRONTEND_URL=${FRONTEND_URL},GCS_BUCKET=${GCS_BUCKET},JWT_SECRET=${JWT_SECRET},JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET},DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD_URLENCODED}@localhost/${DATABASE_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}&schema=public,SMTP_HOST=,SMTP_PORT=,SMTP_USER=,SMTP_PASS=,SMTP_FROM="

echo ""
echo "✅ Cloud Run deployment complete."
echo "Get the service URL with:"
echo "  gcloud run services describe ${SERVICE_NAME} --project ${PROJECT_ID} --region ${REGION} --format 'value(status.url)'"
