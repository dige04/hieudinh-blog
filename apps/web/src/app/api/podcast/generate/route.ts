import { NextResponse } from 'next/server'
import { generateEpisode, type GenerateEpisodeOptions } from '@/lib/podcast/generator'

// Force Node.js runtime for Payload CMS and OpenAI
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for long TTS

/**
 * POST /api/podcast/generate
 * Generate a new podcast episode from top HN stories
 *
 * Requires PODCAST_API_SECRET header for authentication
 *
 * Body (optional):
 * - minScore: number (default: 100)
 * - minComments: number (default: 20)
 * - maxArticles: number (default: 5)
 * - publish: boolean (default: true)
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const apiSecret = process.env.PODCAST_API_SECRET
    const authHeader = request.headers.get('x-api-secret')

    if (!apiSecret) {
      console.error('[Podcast API] PODCAST_API_SECRET not configured')
      return NextResponse.json(
        { error: 'API not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== apiSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse options from body
    let options: GenerateEpisodeOptions = {}
    try {
      const body = await request.json()
      options = {
        minScore: body.minScore,
        minComments: body.minComments,
        maxArticles: body.maxArticles,
        publish: body.publish,
      }
    } catch {
      // Empty body is fine, use defaults
    }

    console.log('[Podcast API] Starting episode generation...', options)

    const episode = await generateEpisode(options)

    console.log('[Podcast API] Episode generated successfully:', episode.slug)

    return NextResponse.json({
      success: true,
      episode: {
        id: episode.id,
        title: episode.title,
        slug: episode.slug,
        articleCount: episode.articleCount,
        duration: episode.duration,
      },
    })
  } catch (error) {
    console.error('[Podcast API] Generation failed:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/podcast/generate
 * Health check endpoint
 */
export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasTTS = !!process.env.TTS_API_KEY || process.env.TTS_PROVIDER === 'mock'
  const hasSecret = !!process.env.PODCAST_API_SECRET

  return NextResponse.json({
    status: 'ok',
    configured: {
      openai: hasOpenAI,
      tts: hasTTS,
      auth: hasSecret,
    },
    provider: process.env.TTS_PROVIDER || 'mock',
  })
}
