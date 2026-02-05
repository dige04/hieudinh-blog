# Phase 01: Foundation

**Parent:** [plan.md](./plan.md)
**Dependencies:** None
**Date:** 2026-02-05 | **Priority:** P0 | **Status:** Completed

---

## Overview

Establish data model and TTS abstraction. Create Podcast collection, update Media for audio, build pluggable TTS interface.

---

## Key Insights

- Follow `Weekly.ts` collection pattern exactly
- Media already uses S3 storage via `@payloadcms/storage-s3`
- TTS abstraction enables easy provider swapping without code changes

---

## Requirements

1. Podcast collection with audio upload support
2. Media accepts `audio/*` mimetypes
3. TTS provider interface with mock implementation
4. Manual episode creation works end-to-end

---

## Architecture

### Podcast Collection Schema

```typescript
// apps/web/src/collections/Podcast.ts
import type { CollectionConfig } from 'payload'

export const Podcast: CollectionConfig = {
  slug: 'podcast',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'status'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'description', type: 'textarea', required: true },
    { name: 'transcript', type: 'richText' },
    { name: 'audio', type: 'upload', relationTo: 'media', required: true },
    { name: 'duration', type: 'number', admin: { position: 'sidebar', description: 'Duration in seconds' } },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    {
      name: 'sources',
      type: 'array',
      fields: [
        { name: 'hnId', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
    { name: 'publishedAt', type: 'date', required: true, admin: { position: 'sidebar' } },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
    },
  ],
}
```

### TTS Provider Interface

```typescript
// apps/web/src/lib/tts/types.ts
export interface TTSOptions {
  voice?: string
  speed?: number  // -3 to 3 for FPT, 0.5-2.0 for others
  format?: 'mp3' | 'wav'
}

export interface TTSProvider {
  name: string
  synthesize(text: string, options?: TTSOptions): Promise<Buffer>
}

export interface TTSResult {
  buffer: Buffer
  duration: number  // seconds
}
```

### TTS Factory

```typescript
// apps/web/src/lib/tts/index.ts
import { TTSProvider } from './types'
import { FPTProvider } from './providers/fpt'
import { MockProvider } from './providers/mock'

export function createTTSProvider(): TTSProvider {
  const provider = process.env.TTS_PROVIDER || 'mock'
  switch (provider) {
    case 'fpt': return new FPTProvider()
    case 'mock': return new MockProvider()
    default: throw new Error(`Unknown TTS provider: ${provider}`)
  }
}
```

---

## Related Code Files

### Existing (modify)
- `/apps/web/src/collections/Media.ts` - Add audio mimetypes
- `/apps/web/src/payload.config.ts` - Register Podcast collection

### New (create)
- `/apps/web/src/collections/Podcast.ts` - Podcast collection
- `/apps/web/src/lib/tts/types.ts` - TTS interfaces
- `/apps/web/src/lib/tts/index.ts` - TTS factory
- `/apps/web/src/lib/tts/providers/fpt.ts` - FPT.AI provider
- `/apps/web/src/lib/tts/providers/mock.ts` - Mock provider for dev

---

## Implementation Steps

1. Update `Media.ts`: change `mimeTypes: ['image/*']` to `['image/*', 'audio/*']`
2. Create `Podcast.ts` collection following Weekly.ts pattern
3. Register Podcast in `payload.config.ts`: add to collections array
4. Create TTS types and interfaces
5. Implement MockProvider (returns silence buffer)
6. Implement FPTProvider (real API integration)
7. Run `pnpm payload generate:types` to update types
8. Test: create manual episode via Payload admin

---

## Todo

- [x] Update Media.ts mimeTypes
- [x] Create Podcast.ts collection
- [x] Update payload.config.ts
- [x] Create TTS types.ts
- [x] Create TTS factory index.ts
- [x] Implement MockProvider
- [x] Implement FPTProvider
- [x] Generate Payload types
- [x] Manual test: create episode in admin

---

## Success Criteria

- [x] Podcast collection visible in Payload admin
- [x] Can upload audio files to Media
- [x] Can create podcast episode with audio relation
- [x] TTS factory returns correct provider based on env
- [x] MockProvider returns valid audio buffer

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| S3 storage config for audio | Medium | Test upload before proceeding |
| Type generation fails | Low | Run manually, fix schema |

---

## Security Considerations

- TTS API keys in environment variables only
- No API key exposure in client code
- Rate limit TTS calls to prevent cost overrun

---

## Next Steps

After completion, proceed to [Phase 02: Generation Pipeline](./phase-02-generation-pipeline.md)

---

## Completion Notes

- **Date completed:** 2026-02-05
- **All 6 files created/modified successfully**
- **TypeScript compilation:** PASS
- **Code review:** APPROVED (8.5/10)
- **High-priority fixes applied:** input validation, exponential backoff, MP3 duration parsing
