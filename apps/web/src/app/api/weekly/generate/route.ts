import { NextResponse } from 'next/server'
import { runWeeklyGeneration } from '../../../../../scripts/generate-weekly'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getConfiguredFlags() {
  return {
    anthropicBaseUrl: !!process.env.ANTHROPIC_BASE_URL,
    anthropicAuthToken: !!process.env.ANTHROPIC_AUTH_TOKEN,
    weeklyApiSecret: !!process.env.WEEKLY_API_SECRET,
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    configured: getConfiguredFlags(),
  })
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.WEEKLY_API_SECRET
    const requestSecret = request.headers.get('x-api-secret')

    if (!configuredSecret) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'API_NOT_CONFIGURED',
            message: 'WEEKLY_API_SECRET is not configured',
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

    let dryRun = false
    try {
      const body = await request.json()
      dryRun = body?.dryRun === true
    } catch {
      // Empty or invalid JSON body -> use default dryRun = false
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        data: {
          dryRun: true,
          message: 'Dry run passed',
        },
      })
    }

    const result = await runWeeklyGeneration()

    return NextResponse.json({
      success: true,
      data: {
        dryRun: false,
        action: result.action,
        title: result.title,
        slug: result.slug,
      },
    })
  } catch (error) {
    console.error('[Weekly API] Generation failed:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message,
        },
      },
      { status: 500 },
    )
  }
}
