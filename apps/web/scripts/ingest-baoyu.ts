/**
 * CLI script to ingest a post from baoyu.io.
 *
 * Usage:
 *   npx tsx scripts/ingest-baoyu.ts [url]
 *
 * If no URL is provided, picks the latest unprocessed post from RSS.
 */

async function main() {
  const targetUrl = process.argv[2]

  console.log('Baoyu.io Content Ingester\n')

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  const { runBaoyuPipeline } = await import('../src/lib/baoyu/pipeline')
  const result = await runBaoyuPipeline(payload, targetUrl)

  if (result.action === 'skipped') {
    console.log('\nNo new posts to ingest.')
  } else {
    console.log(`\nDone!`)
    console.log(`  Title: ${result.title}`)
    console.log(`  Slug: ${result.slug}`)
    console.log(`  Action: ${result.action}`)
    console.log(`  Source: ${result.sourceUrl}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
