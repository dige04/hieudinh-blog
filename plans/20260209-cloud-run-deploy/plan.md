# Cloud Run Deployment Plan

**Date**: 2026-02-09 | **Branch**: feat/lovable-ui-migration

## Summary
Migrate Next.js 15 + Payload CMS app from Cloudflare Workers to GCP Cloud Run.
Data layer stays on Supabase (Postgres + S3 storage) -- zero data migration.

## Phases

### Phase 01 - Dockerize Next.js App [IN PROGRESS]
- Create multi-stage Dockerfile for standalone Next.js build
- Create .dockerignore
- Test local Docker build

### Phase 02 - Deploy to Cloud Run
- Push image to Artifact Registry
- Deploy Cloud Run service with env vars
- Verify app is running

### Phase 03 - Domain Mapping
- Map hieudinh.dev to Cloud Run service
- Verify DNS propagation
- Test live site

## Architecture
```
User → hieudinh.dev → Cloud Run (Next.js standalone)
                          ↓
                    Supabase Postgres (DATABASE_URL)
                    Supabase S3 Storage (media)
```
