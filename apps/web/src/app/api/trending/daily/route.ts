import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getConfiguredFlags() {
  return {
    anthropicBaseUrl: !!process.env.ANTHROPIC_BASE_URL,
    anthropicAuthToken: !!process.env.ANTHROPIC_AUTH_TOKEN,
    trendingApiSecret: !!process.env.TRENDING_API_SECRET,
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    pipeline: 'daily-trending',
    configured: getConfiguredFlags(),
  })
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.TRENDING_API_SECRET
    const requestSecret = request.headers.get('x-api-secret')

    if (!configuredSecret) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'API_NOT_CONFIGURED',
            message: 'TRENDING_API_SECRET is not configured',
          },
        },
        { status: 500 },
      )
    }

    if (requestSecret !== configuredSecret) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
        },
        { status: 401 },
      )
    }

    // Dynamic import to avoid loading pipeline deps at module level
    const { runDailyPipeline } = await import('../../../../../scripts/run-daily-pipeline')
    const result = await runDailyPipeline()

    return NextResponse.json({
      success: true,
      data: {
        batchId: result.batchId,
        itemCount: result.itemCount,
        phases: result.log.phases,
      },
    })
  } catch (error) {
    console.error('[Daily Trending API] Pipeline failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PIPELINE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 },
    )
  }
}
