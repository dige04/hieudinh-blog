import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')

  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'weekly', limit: 1 })
  console.log(JSON.stringify(result.docs[0]?.content, null, 2))
  process.exit(0)
}

main()
