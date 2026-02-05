import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/podcast/track
 * Track podcast listen events
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { episodeId } = body

    if (!episodeId) {
      return NextResponse.json({ error: 'episodeId required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Find episode
    const episode = await payload.findByID({
      collection: 'podcast',
      id: episodeId,
    })

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    // Increment listen count
    await payload.update({
      collection: 'podcast',
      id: episodeId,
      data: {
        listens: ((episode.listens as number) || 0) + 1,
      },
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[Track API] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
