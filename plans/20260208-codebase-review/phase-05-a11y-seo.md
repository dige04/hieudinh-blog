# Phase 05 - Accessibility & SEO

**Date**: 2026-02-08 | **Priority**: P2 | **Status**: Pending

## Context
- SearchOverlay lacks ARIA attributes, keyboard trapping
- Sitemap missing podcast URLs
- No robots.txt
- JSON-LD missing fields
- AudioPlayer missing keyboard shortcuts

## Implementation Steps

### 1. Fix SearchOverlay accessibility
**File**: `src/components/blog/SearchOverlay.tsx`

- Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Add Escape key handler
- Add focus trap (Tab/Shift+Tab stays within dialog)
- Add `aria-label` to close button

### 2. Add podcast URLs to sitemap
**File**: `src/app/sitemap.ts`

Query podcast collection and add to sitemap array.

### 3. Create robots.txt
**File**: `public/robots.txt`
```
User-agent: *
Allow: /
Sitemap: https://hieudinh.com/sitemap.xml
```

### 4. Enhance JSON-LD
**File**: `src/components/JsonLd.tsx`

Add `wordCount`, `articleSection`, `keywords`, author image.

### 5. AudioPlayer keyboard shortcuts
**File**: `src/components/podcast/AudioPlayer.tsx`

- Space: play/pause
- Left/Right arrows: seek -10s/+10s
- Add `aria-live="polite"` region for time updates

### 6. Image optimization
**File**: `src/components/blog/BlogCard.tsx`

Add `sizes` attribute, explicit `loading="lazy"`.

### 7. OG image caching
**File**: `src/app/blog/[slug]/opengraph-image.tsx`

Add `export const revalidate = 3600` for ISR.

## Success Criteria
- [ ] SearchOverlay navigable by keyboard only
- [ ] Sitemap includes all published content types
- [ ] Lighthouse Accessibility score > 90
- [ ] All images have proper alt text and sizes
