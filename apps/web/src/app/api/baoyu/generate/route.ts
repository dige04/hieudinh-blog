import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.WEEKLY_API_SECRET
    const requestSecret = request.headers.get('x-api-secret')

    if (!configuredSecret) {
      return NextResponse.json(
        { success: false, error: { code: 'API_NOT_CONFIGURED', message: 'WEEKLY_API_SECRET is not configured' } },
        { status: 500 },
      )
    }

    if (requestSecret !== configuredSecret) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 },
      )
    }

    let targetUrl: string | undefined
    try {
      const body = await request.json()
      targetUrl = body?.url
    } catch {
      // Empty body - will use latest from RSS
    }

    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })
    const { runBaoyuPipeline } = await import('../../../../lib/baoyu/pipeline')

    const result = await runBaoyuPipeline(payload, targetUrl)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[Baoyu API] Ingestion failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: { code: 'INGESTION_FAILED', message } },
      { status: 500 },
    )
  }
}
