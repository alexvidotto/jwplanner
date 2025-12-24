#!/bin/bash
set -e

# Configuration
PROJECT_ID="web-planner-481617"
PROJECT_NUMBER="909358456374"
REGION="us-central1"
REPO="planner-repo"

# Check arguments
if [[ "$1" != "dev" && "$1" != "qa" ]]; then
    echo "Usage: ./gcp_deploy.sh [dev|qa]"
    echo "Example: ./gcp_deploy.sh dev"
    exit 1
fi

ENV=$1
SERVICE_BACKEND="planner-backend-$ENV"
SERVICE_FRONTEND="planner-frontend-$ENV"

echo "=================================================="
echo "Initializing Deployment for $ENV"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "=================================================="

# Load secrets
if [ -f "deployment_secrets.sh" ]; then
    source deployment_secrets.sh
    load_secrets "$ENV"
    echo "Secrets loaded."
else
    echo "WARNING: deployment_secrets.sh not found."
fi

# 0. Setup Infrastructure
echo "--------------------------------------------------"
echo "Step 0: Checking Infrastructure"
echo "--------------------------------------------------"

echo "Enabling necessary APIs..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project "$PROJECT_ID"

echo "Checking Artifact Registry..."
if ! gcloud artifacts repositories describe "$REPO" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    gcloud artifacts repositories create "$REPO" \
        --repository-format=docker \
        --location="$REGION" \
        --project="$PROJECT_ID"
else
    echo "Repository $REPO exists."
fi

# Check for Critical Vars
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set. Please update deployment_secrets.sh."
    exit 1
fi

# 1. Backend Deployment
echo "--------------------------------------------------"
echo "Step 1: Building and Deploying Backend"
echo "--------------------------------------------------"

cd backend

IMAGE_BACKEND="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/backend:$ENV"

echo "Submitting build for $IMAGE_BACKEND..."
gcloud builds submit --tag "$IMAGE_BACKEND" .

echo "Deploying Cloud Run service: $SERVICE_BACKEND..."
gcloud run deploy "$SERVICE_BACKEND" \
    --image "$IMAGE_BACKEND" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "DATABASE_URL=$DATABASE_URL,NODE_ENV=production,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL,FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY" \
    --add-cloudsql-instances "web-planner-481617:southamerica-east1:lab" \
    --timeout 300s \
    --project "$PROJECT_ID"

echo "Making Backend Service Public..."
gcloud run services add-iam-policy-binding "$SERVICE_BACKEND" \
    --region "$REGION" \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --project "$PROJECT_ID"

# Get Backend URL
BACKEND_URL=$(gcloud run services describe "$SERVICE_BACKEND" \
    --region "$REGION" \
    --format 'value(status.url)' \
    --project "$PROJECT_ID")

echo "Backend deployed at: $BACKEND_URL"

cd ..

# 2. Frontend Deployment
echo "--------------------------------------------------"
echo "Step 2: Building and Deploying Frontend"
echo "--------------------------------------------------"

cd frontend

IMAGE_FRONTEND="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/frontend:$ENV"

echo "Submitting build for $IMAGE_FRONTEND (API_URL=$BACKEND_URL)..."
# Build Frontend using Cloud Build to pass variables
gcloud builds submit --config cloudbuild.yaml \
    --substitutions "_VITE_API_URL=$BACKEND_URL,\
_IMAGE_TAG=$IMAGE_FRONTEND,\
_VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY,\
_VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN,\
_VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID,\
_VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET,\
_VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID,\
_VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID" \
    --project "$PROJECT_ID" \
    .

echo "Deploying Cloud Run service: $SERVICE_FRONTEND..."
gcloud run deploy "$SERVICE_FRONTEND" \
    --image "$IMAGE_FRONTEND" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --project "$PROJECT_ID"

echo "Making Frontend Service Public..."
gcloud run services add-iam-policy-binding "$SERVICE_FRONTEND" \
    --region "$REGION" \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --project "$PROJECT_ID"

FRONTEND_URL=$(gcloud run services describe "$SERVICE_FRONTEND" \
    --region "$REGION" \
    --format 'value(status.url)' \
    --project "$PROJECT_ID")

echo "=================================================="
echo "Deployment Complete!"
echo "Backend ($ENV): $BACKEND_URL"
echo "Frontend ($ENV): $FRONTEND_URL"
echo "=================================================="
