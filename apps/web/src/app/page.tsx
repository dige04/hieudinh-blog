import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

// Force dynamic rendering - D1 database requires runtime
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'weekly',
    where: {
      status: { equals: 'published' },
    },
    sort: '-publishedAt',
    limit: 10,
  })

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">VN AI Weekly</h1>
        <p className="text-muted-foreground">
          Cập nhật tin AI hàng tuần bằng tiếng Việt
        </p>
      </header>

      <section className="space-y-8">
        {posts.docs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Chưa có bài viết nào.</p>
            <p className="text-sm mt-2">
              <Link href="/admin" className="underline hover:text-foreground">
                Đăng nhập Admin
              </Link>{' '}
              để tạo bài viết đầu tiên.
            </p>
          </div>
        ) : (
          posts.docs.map((post) => (
            <article
              key={post.id}
              className="border-b border-border pb-8 last:border-0"
            >
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="text-2xl font-semibold group-hover:text-primary/80 transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground mt-2">{post.excerpt}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span>{post.readTime}</span>
                  <span>•</span>
                  <span>
                    {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </Link>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
