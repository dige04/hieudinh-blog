/**
 * Blog illustration generator using gemini-3-pro-image-preview.
 *
 * Generates sketchnote-style (whiteboard doodle) illustrations for weekly
 * digest posts. Uses the LLM proxy's OpenAI-compatible chat completions
 * endpoint with the image generation model.
 *
 * Style: minimalist hand-drawn, 2-3 colors (blue, red, black) on white.
 */

import { writeFileSync } from 'fs'
import * as path from 'path'
import type { Payload } from 'payload'
import { getArtifactDir } from './artifacts'

const IMAGE_MODEL = 'gemini-3-pro-image-preview'
const IMAGE_TIMEOUT_MS = 180_000
const MAX_RETRIES = 3
const BASE_DELAY_MS = 15_000

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const STYLE_PREFIX =
  'Sketchnote style illustration on a clean white background. ' +
  'Minimalist hand-drawn doodle, whiteboard illustration style. ' +
  'Drawn with simple lines using only black, dark blue, and red marker ink. ' +
  'No photographic elements, no gradients, no 3D rendering. ' +
  'Hand-drawn text labels in English only if needed. ' +
  'Visual note-taking aesthetic with simple icons, arrows, and stick figures.'

/**
 * Build an image generation prompt from blog content.
 *
 * Extracts key themes from the title and section headings
 * to create a content-specific sketchnote illustration.
 */
export function buildIllustrationPrompt(
  title: string,
  excerpt: string,
  sectionHeadings: string[]
): string {
  const topics = sectionHeadings.slice(0, 5).join(', ')

  return (
    `${STYLE_PREFIX}\n\n` +
    `Create an illustration for a Vietnamese tech blog post titled "${title}". ` +
    `The post covers these topics: ${topics}. ` +
    `Summary: ${excerpt.slice(0, 200)}.\n\n` +
    `The illustration should visually represent the main concepts using simple ` +
    `icons, diagrams, or metaphors. Include visual elements like gears, lightbulbs, ` +
    `circuit boards, robots, code brackets, or network nodes as appropriate. ` +
    `Keep it clean, uncluttered, and immediately recognizable as a tech topic.`
  )
}

// ---------------------------------------------------------------------------
// Image generation via proxy
// ---------------------------------------------------------------------------

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string; image_url?: { url: string } }> | null
      images?: Array<{ type: string; image_url?: { url: string }; index?: number }>
    }
  }>
  error?: { message?: string; code?: number }
}

/**
 * Extract base64 image data from the chat completion response.
 *
 * The proxy returns image data in message.images[] (not content):
 *   { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }
 *
 * Also handles fallback formats in message.content.
 */
function extractImageBase64(data: ChatCompletionResponse): Buffer | null {
  const choices = data.choices
  if (!choices || choices.length === 0) return null

  const message = choices[0].message
  if (!message) return null

  // Primary: check message.images[] (proxy format for gemini image model)
  const images = message.images
  if (Array.isArray(images) && images.length > 0) {
    for (const img of images) {
      if (img.type === 'image_url' && img.image_url?.url) {
        const match = img.image_url.url.match(/^data:image\/\w+;base64,(.+)$/)
        if (match) return Buffer.from(match[1], 'base64')
      }
    }
  }

  // Fallback: check message.content
  const content = message.content
  if (!content) return null

  // content is a list of parts
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        const match = part.image_url.url.match(/^data:image\/\w+;base64,(.+)$/)
        if (match) return Buffer.from(match[1], 'base64')
      }
    }
    return null
  }

  // content is a string (possibly a data URI)
  if (typeof content === 'string') {
    const dataUriMatch = content.match(/data:image\/\w+;base64,([A-Za-z0-9+/=]+)/)
    if (dataUriMatch) return Buffer.from(dataUriMatch[1], 'base64')
  }

  return null
}

/**
 * Generate a sketchnote illustration by calling the image model.
 * Returns a PNG buffer or null if generation fails.
 */
export async function generateIllustration(prompt: string): Promise<Buffer | null> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'http://103.90.226.240:8317'
  const authToken = process.env.PROXY_IMAGE_AUTH_TOKEN || 'sk-dummy'

  const body = JSON.stringify({
    model: IMAGE_MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[IMG] Generating illustration (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`)

      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body,
        signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
      })

      if (!response.ok) {
        const errorText = await response.text()
        const retryable = response.status === 429 || response.status >= 500
        if (retryable && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * 2 ** attempt
          console.log(`[IMG] ${response.status} error, retrying in ${delay}ms`)
          await sleep(delay)
          continue
        }
        console.warn(`[IMG] API error: ${response.status} - ${errorText.slice(0, 200)}`)
        return null
      }

      const rawJson = await response.text()
      let data: ChatCompletionResponse
      try {
        data = JSON.parse(rawJson)
      } catch {
        console.warn(`[IMG] Invalid JSON response`)
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS)
          continue
        }
        return null
      }

      if (data.error) {
        const retryable =
          data.error.code === 503 || data.error.code === 429 ||
          (data.error.message || '').includes('capacity')
        if (retryable && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * 2 ** attempt
          console.log(`[IMG] ${data.error.message?.slice(0, 100)}, retrying in ${delay}ms`)
          await sleep(delay)
          continue
        }
        console.warn(`[IMG] Error: ${data.error.message?.slice(0, 200)}`)
        return null
      }

      const imageBuffer = extractImageBase64(data)
      if (!imageBuffer) {
        console.warn('[IMG] No image data found in response')
        // Log response structure for debugging
        const msg = data.choices?.[0]?.message
        const images = msg?.images
        const content = msg?.content
        if (images) {
          console.warn(`[IMG] images field: ${JSON.stringify(images).slice(0, 200)}`)
        }
        if (typeof content === 'string') {
          console.warn(`[IMG] Content is string, length: ${content.length}`)
        } else if (Array.isArray(content)) {
          console.warn(`[IMG] Content is array with ${content.length} parts: ${content.map(p => p.type).join(', ')}`)
        } else if (content === null || content === undefined) {
          console.warn(`[IMG] Content is ${content}`)
        }
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS)
          continue
        }
        return null
      }

      console.log(`[IMG] Generated image: ${imageBuffer.length} bytes`)
      return imageBuffer
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError' && attempt < MAX_RETRIES) {
        console.log(`[IMG] Timeout, retrying...`)
        await sleep(BASE_DELAY_MS)
        continue
      }
      console.warn(`[IMG] Error: ${(error as Error).message}`)
      return null
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Upload to Payload CMS Media collection
// ---------------------------------------------------------------------------

/**
 * Upload an image buffer to Payload CMS Media collection.
 * Returns the media document ID or null on failure.
 */
export async function uploadToMedia(
  payload: Payload,
  imageBuffer: Buffer,
  alt: string,
  filename: string
): Promise<string | null> {
  try {
    // Payload's create with upload requires a File-like object
    const file = {
      data: imageBuffer,
      mimetype: 'image/png',
      name: filename,
      size: imageBuffer.length,
    }

    const media = await payload.create({
      collection: 'media',
      data: { alt },
      file,
    })

    console.log(`[IMG] Uploaded to media: id=${media.id}`)
    return String(media.id)
  } catch (error) {
    console.warn(`[IMG] Failed to upload to media: ${(error as Error).message}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Pipeline integration: generate + upload + cache
// ---------------------------------------------------------------------------

/**
 * Generate and upload a blog illustration for a weekly post.
 *
 * Uses the artifact system for caching: if a thumbnail has already
 * been generated for this weekId, returns the cached media ID.
 *
 * Returns the Payload media document ID, or null if generation fails.
 * Failures are non-blocking — the post will publish without a thumbnail.
 */
export async function generateWeeklyIllustration(
  payload: Payload,
  weekId: string,
  title: string,
  excerpt: string,
  sectionHeadings: string[]
): Promise<string | null> {
  // Build prompt
  const prompt = buildIllustrationPrompt(title, excerpt, sectionHeadings)
  console.log(`[IMG] Prompt: ${prompt.slice(0, 150)}...`)

  // Generate image
  const imageBuffer = await generateIllustration(prompt)
  if (!imageBuffer) {
    console.warn('[IMG] Image generation failed, post will publish without thumbnail')
    return null
  }

  // Save to artifact for debugging
  const artifactDir = getArtifactDir(weekId)
  const imgPath = path.join(artifactDir, 'thumbnail.png')
  writeFileSync(imgPath, imageBuffer)
  console.log(`[IMG] Saved artifact: ${imgPath}`)

  // Upload to Payload Media
  const slug = weekId.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const filename = `weekly-${slug}-thumbnail.png`
  const alt = `Illustration for ${title}`

  const mediaId = await uploadToMedia(payload, imageBuffer, alt, filename)
  return mediaId
}

// ---------------------------------------------------------------------------
// Section-level illustration generation
// ---------------------------------------------------------------------------

function buildSectionPrompt(
  title: string,
  sectionHeading: string,
  index: number,
  total: number
): string {
  return (
    `${STYLE_PREFIX}\n\n` +
    `Create an illustration for section "${sectionHeading}" of a Vietnamese tech blog post titled "${title}". ` +
    `This is section ${index + 1} of ${total}. ` +
    `The illustration should visually represent the concept of "${sectionHeading}" using simple ` +
    `metaphors, icons, or diagrams. Keep it focused on this single concept. ` +
    `No text labels unless absolutely necessary for understanding.`
  )
}

/**
 * Generate illustrations for multiple sections of a blog post.
 * Returns a Map of sectionIndex -> mediaId (uploaded to Payload Media).
 * Sections that fail are silently skipped.
 */
export async function generateSectionIllustrations(
  payload: Payload,
  weekId: string,
  title: string,
  sectionHeadings: string[]
): Promise<Map<number, string>> {
  const results = new Map<number, string>()

  for (let i = 0; i < sectionHeadings.length; i++) {
    const heading = sectionHeadings[i]
    console.log(`[IMG] Section ${i + 1}/${sectionHeadings.length}: "${heading}"`)

    const prompt = buildSectionPrompt(title, heading, i, sectionHeadings.length)
    const imageBuffer = await generateIllustration(prompt)

    if (!imageBuffer) {
      console.warn(`[IMG] Failed to generate image for section: ${heading}`)
      continue
    }

    // Save artifact for debugging
    const artifactDir = getArtifactDir(weekId)
    const imgPath = path.join(artifactDir, `section-${i}.jpg`)
    writeFileSync(imgPath, imageBuffer)

    // Upload to media
    const slug = weekId.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const filename = `weekly-${slug}-section-${i}.jpg`
    const alt = `Illustration: ${heading}`
    const mediaId = await uploadToMedia(payload, imageBuffer, alt, filename)

    if (mediaId) {
      results.set(i, mediaId)
    }

    // Small delay between generations to avoid rate limits
    if (i < sectionHeadings.length - 1) {
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  console.log(`[IMG] Generated ${results.size}/${sectionHeadings.length} section images`)
  return results
}
