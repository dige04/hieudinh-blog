# Codebase Patterns Report: Tech Digest Podcast

## 1. Payload CMS Collections
- **Path**: `apps/web/src/collections/`
- **Key Files**: 
    - `Weekly.ts`: Main content collection.
    - `Media.ts`: Handles file uploads (currently images only).
- **Structure**:
    ```typescript
    // apps/web/src/collections/Media.ts
    export const Media: CollectionConfig = {
      slug: 'media',
      upload: { mimeTypes: ['image/*'] }, // Needs update for audio
      // ...
    }
    ```

## 2. API Routes
- **Path**: `apps/web/src/app/api/`
- **Existing**: `subscribe`, `confirm`, `preview`.
- **Pattern**: Next.js App Router Route Handlers.
    ```typescript
    // apps/web/src/app/api/subscribe/route.ts
    export async function POST(req: Request) { ... }
    ```

## 3. Cloudflare Integration
- **Config**: `apps/web/wrangler.json`
- **Resources**:
    - **D1 Database**: `vn-ai-weekly-db` (binding: `DB`)
    - **R2 Bucket**: `vn-ai-weekly-media` (binding: `R2`)
- **Storage**: `payload.config.ts` uses `@payloadcms/storage-s3` to connect to R2 via S3-compatible API.

## 4. Frontend Patterns
- **Blog Home**: `apps/web/src/app/blog/page.tsx` fetches data using `payload.find`.
- **Components**: `apps/web/src/components/blog/` contains UI components.
- **Pattern**: Server Components fetch data, pass to Client Components.

## 5. Environment Variables
- **Management**: `payload.config.ts` reads `process.env`.
- **Keys**: `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `DATABASE_URL`.

## Recommendations for Podcast Feature
1.  **New Collection**: Create `apps/web/src/collections/Podcast.ts`.
2.  **Audio Upload**: Update `Media.ts` or create `Audio.ts` to allow `audio/*` mime types.
3.  **Storage**: Reuse R2 `vn-ai-weekly-media` bucket.
4.  **Frontend**: Create `apps/web/src/components/podcast/AudioPlayer.tsx`.
