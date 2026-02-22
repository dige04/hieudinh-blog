import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    daily: {
      lastBatchTime: string | null
      lastBatchItemCount: number
      batchesLast24h: number
    }
    weekly: {
      lastWeeklySlug: string | null
      lastWeeklyStatus: string | null
      currentWeekDraftExists: boolean
    }
  }
}

export async function GET() {
  try {
    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })

    // Check daily batches
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const dailyDocs = await payload.find({
      collection: 'daily-trending' as any,
      where: { date: { greater_than_equal: oneDayAgo.toISOString() } },
      sort: '-date',
      limit: 10,
    })

    const lastBatch = dailyDocs.docs[0] as any
    const daily = {
      lastBatchTime: lastBatch ? String(lastBatch.date) : null,
      lastBatchItemCount: lastBatch ? (lastBatch.itemCount as number) : 0,
      batchesLast24h: dailyDocs.docs.length,
    }

    // Check weekly
    const weeklyDocs = await payload.find({
      collection: 'weekly',
      sort: '-publishedAt',
      limit: 1,
    })

    const lastWeekly = weeklyDocs.docs[0]

    // Check if current week draft exists
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
    const currentWeekSlug = `${now.getFullYear()}-w${week.toString().padStart(2, '0')}`

    const currentWeek = await payload.find({
      collection: 'weekly',
      where: { slug: { equals: currentWeekSlug } },
      limit: 1,
    })

    const weekly = {
      lastWeeklySlug: lastWeekly ? String(lastWeekly.slug) : null,
      lastWeeklyStatus: lastWeekly ? String(lastWeekly.status) : null,
      currentWeekDraftExists: currentWeek.docs.length > 0,
    }

    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (daily.batchesLast24h >= 2 && daily.lastBatchItemCount > 0) {
      status = 'healthy'
    } else if (daily.batchesLast24h >= 1) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      checks: { daily, weekly },
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { status: 'unhealthy', timestamp: new Date().toISOString(), error: 'Health check failed' },
      { status: 500 },
    )
  }
}
