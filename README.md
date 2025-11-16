
# Backend — Node.js (TypeScript) for Cloud Run

This is a minimal Express + TypeScript backend that:
- Verifies Firebase ID tokens (requires a Firebase service account JSON)
- Uploads files to Google Cloud Storage under `{uid}/` prefix
- Lists files for the authenticated user (admin users can list all)
- Deletes files owned by the authenticated user

## Setup (local)

1. Copy your Firebase service account JSON to `backend-node-cloudrun/serviceAccountKey.json`.
2. Create a Google Cloud Storage bucket and update `.env` with `GCP_BUCKET_NAME`.
3. Install:
```bash
npm install
```
4. Run locally:
```bash
npm run dev
```

## Build & Docker / Cloud Run

Build:
```bash
npm run build
```

Dockerfile is provided. To deploy to Cloud Run (example):
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/backend-node-cloudrun
gcloud run deploy backend-node-cloudrun \
  --image gcr.io/YOUR_PROJECT_ID/backend-node-cloudrun \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

Make sure the Cloud Run service account has `roles/storage.objectAdmin` on the bucket.

