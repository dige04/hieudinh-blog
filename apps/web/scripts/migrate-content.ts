// Migration script: Import VN AI Weekly posts from blogData.ts to Payload CMS
// Run with: npx tsx scripts/migrate-content.ts

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

console.log('Starting migration...')

// Dynamic import to ensure env vars are loaded first
const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')

const posts = [
  {
    title: 'Tuần báo Tech & AI - Tuần 04/2026',
    slug: '2026-w04',
    excerpt: 'Tuần này chứng kiến sự bùng nổ của hệ sinh thái công cụ lập trình AI: Claude ra mắt MCP Apps, hệ thống plugin Cowork và tính năng đo lường đóng góp; Kimi K2.5 leo lên vị trí dẫn đầu SWE-Bench; OpenClaw đạt 100.000 GitHub stars.',
    tag: 'ai-weekly',
    tagColor: 'blue',
    publishedAt: '2026-02-01',
    readTime: '15 min read',
    status: 'published',
  },
  {
    title: 'Tuần báo Tech & AI - Tuần 03/2026',
    slug: '2026-w03',
    excerpt: 'Tuần này tập trung vào việc AI phát triển từ trợ lý trò chuyện thành mô-đun năng suất được nhúng trong các công cụ và quy trình làm việc. Những điểm nổi bật chính bao gồm việc tích hợp Claude vào Excel, thực tiễn kỹ thuật của OpenAI cho PostgreSQL và sự trưởng thành của hệ sinh thái Agent.',
    tag: 'ai-weekly',
    tagColor: 'blue',
    publishedAt: '2026-01-25',
    readTime: '12 min read',
    status: 'published',
  },
  {
    title: 'Tuần báo Tech & AI - Tuần 02/2026',
    slug: '2026-w02',
    excerpt: 'Tuần thứ hai của năm mới, lĩnh vực AI tiếp tục tiến lên với tốc độ cao. Tin tức lớn nhất tuần này là Anthropic mở rộng kinh nghiệm thành công của Claude Code sang các kịch bản văn phòng, trong khi sự hợp tác giữa Apple và Google báo hiệu những thay đổi mới trong bối cảnh AI di động.',
    tag: 'ai-weekly',
    tagColor: 'blue',
    publishedAt: '2026-01-18',
    readTime: '10 min read',
    status: 'published',
  },
  {
    title: 'Tuần báo Tech & AI - Tuần 01/2026',
    slug: '2026-w01',
    excerpt: 'Tuần đầu năm mở màn với những insights sâu sắc về AI coding assistants - từ cách build một clone Claude Code với 200 dòng Python đến phương pháp Vibe Coding cho người không biết code. Đặc biệt là câu chuyện về kỹ sư Google tái tạo project một năm trong một giờ - và bài học quan trọng đằng sau nó.',
    tag: 'ai-weekly',
    tagColor: 'blue',
    publishedAt: '2026-01-11',
    readTime: '10 min read',
    status: 'published',
  },
]

async function migrate() {
  const payload = await getPayload({ config })

  const allDocs = await payload.find({ collection: 'weekly', limit: 100 })
  console.log(`Database currently has ${allDocs.totalDocs} weekly posts`)

  for (const post of posts) {
    try {
      const existing = await payload.find({
        collection: 'weekly',
        where: { slug: { equals: post.slug } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`Skipping "${post.title}" - already exists`)
        continue
      }

      await payload.create({
        collection: 'weekly',
        data: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: `Content for ${post.title}. Full content needs to be added via admin panel.`,
                    },
                  ],
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
            },
          },
          tag: post.tag,
          tagColor: post.tagColor,
          publishedAt: post.publishedAt,
          readTime: post.readTime,
          status: post.status,
        },
      })

      console.log(`Created: "${post.title}"`)
    } catch (error) {
      console.error(`Error creating "${post.title}":`, error)
    }
  }

  console.log('Migration complete!')
  process.exit(0)
}

migrate()
