import { getPayload } from 'payload'
import config from '@payload-config'
import { PodcastHome } from '@/components/podcast/PodcastHome'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tech Digest Podcast | Hieu Dinh',
  description: 'Bản tin công nghệ hàng ngày từ Hacker News, bằng tiếng Việt',
  openGraph: {
    title: 'Tech Digest Podcast',
    description: 'Bản tin công nghệ hàng ngày từ Hacker News, bằng tiếng Việt',
    type: 'website',
  },
}

export default async function PodcastPage() {
  const payload = await getPayload({ config })

  const episodes = await payload.find({
    collection: 'podcast',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 50,
  })

  return <PodcastHome episodes={episodes.docs} />
}
