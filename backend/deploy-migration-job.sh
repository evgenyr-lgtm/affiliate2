#!/bin/bash

set -e

PROJECT_ID="af-affiliate-portal"
export PATH="/Users/evgenyrodionov/Downloads/google-cloud-sdk/bin:$PATH"
REGION="us-east4"
JOB_NAME="migrate-db"
INSTANCE_CONNECTION_NAME="af-affiliate-portal:us-east4:af-affiliate-portal-instance"
DATABASE_NAME="af-affiliate-portal-database"
DB_USER="Evgeny92"
DB_PASSWORD_URLENCODED="qX75nJe%40lsgbid%5DU"

JWT_SECRET="bd1cdc433c66e2cc93b51f39d1f49593959e6526e705d93d7bd1df1297912f28"
JWT_REFRESH_SECRET="ceae86f2ca1718cb22029c92eb7c3dfa2277b27eef61c40d17b7e4461df29542"
FRONTEND_URL="https://afl4--af-affiliate-portal.us-east4.hosted.app"

echo "Deploying and executing migration job..."

gcloud run jobs deploy "${JOB_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --source . \
  --set-cloudsql-instances "${INSTANCE_CONNECTION_NAME}" \
  --set-env-vars "NODE_ENV=production,FRONTEND_URL=${FRONTEND_URL},JWT_SECRET=${JWT_SECRET},JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET},DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD_URLENCODED}@localhost/${DATABASE_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}&schema=public" \
  --command "npx" \
  --args "prisma","migrate","deploy" \
  --execute-now \
  --wait
