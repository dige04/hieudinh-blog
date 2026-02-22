/**
 * Baoyu.io content ingestion pipeline.
 *
 * Phases:
 *   1. DISCOVER  -- RSS feed scan for new posts
 *   2. SCRAPE    -- Full page content extraction
 *   3. TRANSLATE -- Chinese -> Vietnamese via GPT-5.3 Codex
 *   4. ILLUSTRATE -- Generate sketchnote images per section
 *   5. PUBLISH   -- Lexical conversion + Payload CMS upsert
 */

import type { Payload } from 'payload'
import { fetchRssFeed, scrapePost, downloadImage } from './scraper'
import { translatePost } from './translator'
import { textToLexical } from '../weekly/shared'
import { uploadToMedia } from '../weekly/illustrator'

export interface BaoyuPipelineResult {
  title: string
  slug: string
  action: 'created' | 'updated' | 'skipped'
  sourceUrl: string
}

/**
 * Ingest a specific post from baoyu.io by URL.
 * If no URL provided, picks the latest from RSS.
 */
export async function runBaoyuPipeline(
  payload: Payload,
  targetUrl?: string
): Promise<BaoyuPipelineResult> {
  // Phase 1: Discover
  let postUrl = targetUrl
  if (!postUrl) {
    console.log('[Baoyu] Phase 1: Discovering latest posts...')
    const feed = await fetchRssFeed(5)
    if (feed.length === 0) throw new Error('No posts found in RSS feed')

    // Find first post not already ingested
    for (const entry of feed) {
      const slug = urlToSlug(entry.url)
      const existing = await payload.find({
        collection: 'weekly',
        where: { slug: { equals: slug } },
        limit: 1,
      })
      if (existing.docs.length === 0) {
        postUrl = entry.url
        break
      }
    }

    if (!postUrl) {
      console.log('[Baoyu] All recent posts already ingested')
      return { title: '', slug: '', action: 'skipped', sourceUrl: '' }
    }
  }
  console.log(`[Baoyu] Target: ${postUrl}`)

  // Phase 2: Scrape
  console.log('[Baoyu] Phase 2: Scraping full content...')
  const post = await scrapePost(postUrl)
  console.log(`  Title: ${post.title}`)
  console.log(`  Content: ${post.content.length} chars`)
  console.log(`  Images: ${post.imageUrls.length}`)

  // Phase 3: Translate
  console.log('[Baoyu] Phase 3: Translating to Vietnamese...')
  const { translatedContent, translatedTitle } = await translatePost(post.content, post.title)
  console.log(`  Translated: ${translatedContent.length} chars`)

  // Phase 4: Handle images
  console.log('[Baoyu] Phase 4: Processing images...')
  // Download original images and upload to our media
  const imageMap = new Map<string, string>() // originalUrl -> mediaId
  for (const imgUrl of post.imageUrls) {
    const buffer = await downloadImage(imgUrl)
    if (buffer) {
      const filename = imgUrl.split('/').pop() || 'image.png'
      const alt = `Image from ${post.title}`
      const mediaId = await uploadToMedia(payload, buffer, alt, filename)
      if (mediaId) {
        imageMap.set(imgUrl, mediaId)
      }
    }
  }
  console.log(`  Uploaded ${imageMap.size}/${post.imageUrls.length} images`)

  // Replace image URLs in translated content with uploaded media references
  // For now, keep the original URLs in content (they'll still work)
  // TODO: replace with Lexical upload nodes when multi-image is integrated

  // Phase 5: Publish
  console.log('[Baoyu] Phase 5: Publishing to CMS...')
  const slug = urlToSlug(postUrl)
  const contentLexical = textToLexical(translatedContent)

  // Generate excerpt
  const excerptText = translatedContent
    .slice(0, 300)
    .replace(/^#.*\n/, '')
    .trim()
  const excerpt = excerptText.slice(0, 200) + (excerptText.length > 200 ? '...' : '')

  const wordCount = translatedContent.split(/\s+/).length
  const readTime = `${Math.max(3, Math.ceil(wordCount / 200))} min read`

  // Note: sourceUrl/sourceAuthor exist in the Weekly collection definition
  // but payload-types.ts may be stale. Cast via `as any` until types are regenerated.
  const postData = {
    title: translatedTitle,
    slug,
    excerpt,
    content: contentLexical as any,
    tag: 'tech',
    tagColor: 'green',
    publishedAt: new Date(post.pubDate).toISOString().split('T')[0],
    readTime,
    status: 'draft',
    sourceUrl: postUrl,
    sourceAuthor: post.author,
    // Use first uploaded image as thumbnail
    ...(imageMap.size > 0 ? { thumbnail: [...imageMap.values()][0] } : {}),
  }

  const existing = await payload.find({
    collection: 'weekly',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  let action: 'created' | 'updated'
  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'weekly',
      id: existing.docs[0].id,
      data: postData as any,
    })
    action = 'updated'
  } else {
    await payload.create({
      collection: 'weekly',
      data: postData as any,
    })
    action = 'created'
  }

  console.log(`[Baoyu] ${action}: "${translatedTitle}" (${slug})`)
  return { title: translatedTitle, slug, action, sourceUrl: postUrl }
}

function urlToSlug(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/blog\//, '')
    .replace(/\//g, '-')
    .replace(/^-|-$/g, '')
}
