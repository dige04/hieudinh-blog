import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PodcastEpisode } from '@/components/podcast/PodcastEpisode'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'podcast',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const episode = result.docs[0]
  if (!episode) return { title: 'Not Found' }

  return {
    title: `${episode.title} | Tech Digest`,
    description: episode.description,
    openGraph: {
      title: episode.title,
      description: episode.description,
      type: 'article',
    },
  }
}

export default async function EpisodePage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'podcast',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const episode = result.docs[0]
  if (!episode || episode.status !== 'published') notFound()

  return <PodcastEpisode episode={episode} />
}
