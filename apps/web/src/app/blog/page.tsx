import { getPayload } from 'payload'
import config from '@payload-config'
import { BlogHome } from '@/components/blog/BlogHome'

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'weekly',
    where: {
      status: { equals: 'published' },
    },
    sort: '-publishedAt',
    limit: 50,
  })

  return <BlogHome posts={posts.docs} />
}
