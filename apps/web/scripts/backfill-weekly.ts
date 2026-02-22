/**
 * Backfill AI Weekly digests from AIGC Weekly (aigc-weekly.agi.li).
 *
 * Fetches Chinese-language AIGC Weekly issues, sends them to the LLM
 * (gpt-5.3-codex via proxy) for translation to Vietnamese with personal
 * insights, then saves as drafts in Payload CMS.
 *
 * AIGC Weekly issue mapping:
 *   AIGC Y26W00 (Jan 4)  → our slug 2026-w01
 *   AIGC Y26W01 (Jan 11) → our slug 2026-w02
 *   ...
 *   AIGC Y26W05 (Feb 8)  → our slug 2026-w06
 *
 * Usage:
 *   npx tsx scripts/backfill-weekly.ts              # Backfill all (W01-W06)
 *   npx tsx scripts/backfill-weekly.ts 3 5           # Backfill W03-W05
 *   npx tsx scripts/backfill-weekly.ts 1 1           # Single week W01
 *   npx tsx scripts/backfill-weekly.ts --from-artifacts pipeline-artifacts/compare/aigc-gpt-5.3-codex
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { callLLM } from '../src/lib/trending/llm'
import { textToLexical } from '../src/lib/weekly/shared'

// Parse --from-artifacts flag
const artifactsIdx = process.argv.indexOf('--from-artifacts')
const artifactsDir = artifactsIdx !== -1
  ? path.resolve(process.cwd(), process.argv[artifactsIdx + 1])
  : null

const YEAR = 2026
const AIGC_BASE = 'https://aigc-weekly.agi.li'

// AIGC Weekly issues available for 2026
// AIGC issue number = our week number - 1
const AIGC_ISSUES: Record<number, { aigcId: string; pubDate: string }> = {
  1: { aigcId: 'Y26W00', pubDate: '2026-01-04' },
  2: { aigcId: 'Y26W01', pubDate: '2026-01-11' },
  3: { aigcId: 'Y26W02', pubDate: '2026-01-18' },
  4: { aigcId: 'Y26W03', pubDate: '2026-01-25' },
  5: { aigcId: 'Y26W04', pubDate: '2026-02-01' },
  6: { aigcId: 'Y26W05', pubDate: '2026-02-08' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekSlug(week: number): string {
  return `${YEAR}-w${week.toString().padStart(2, '0')}`
}

function getWeekId(week: number): string {
  return `Y${String(YEAR).slice(2)}W${week.toString().padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Fetch AIGC Weekly content
// ---------------------------------------------------------------------------

async function fetchAigcIssue(aigcId: string): Promise<string> {
  const url = `${AIGC_BASE}/weekly/${aigcId}`
  console.log(`  Fetching: ${url}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  const html = await response.text()

  // Extract main content from HTML
  // The site renders markdown content in article/main sections
  // Strip HTML tags but preserve structure using simple regex
  const content = extractContent(html)
  return content
}

function extractContent(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')

  // Convert headings
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')

  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

  // Convert bold/strong
  text = text.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**')

  // Convert em/italic
  text = text.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*')

  // Convert list items
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')

  // Convert paragraphs
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return text
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

function getTranslationPrompt(
  chineseContent: string,
  weekId: string,
  pubDate: string,
): string {
  return `Ban la Hieu, mot tech blogger Viet Nam chuyen ve AI. Dua tren noi dung ban tin AIGC Weekly (tieng Trung) duoi day, hay viet lai thanh ban tin AI tuan ${weekId} bang tieng Viet.

NGUON GOC (AIGC Weekly - ${pubDate}):
${chineseContent}

YEU CAU:
1. DICH va VIET LAI noi dung tieng Trung thanh tieng Viet tu nhien
2. GIU NGUYEN tat ca source link/URL goc
3. THEM goc nhin va phan tich cua ban (Hieu) cho developer Viet Nam
4. Khong dich may - viet nhu nguoi Viet dang noi chuyen

STRUCTURE:
# Tuan bao Tech & AI - Tuan ${weekId}

## Mo dau
1-2 doan tom tat xu huong chinh trong tuan. Goc nhin tong quan.

## Tin tuc noi bat
### [Ten tin]
2-5 cau tom tat. Giai thich y nghia cho developer VN. [Nguon](url)

## Mo hinh & Nghien cuu
### [Ten]
2-5 cau. So sanh voi mo hinh truoc. [Nguon](url)

## Cong cu & Thu vien
### [Ten]
2-5 cau. Use case cu the. [Nguon](url)

## Ket luan
- 3-5 bullet points key takeaways
- Du doan xu huong sap toi

## Goc nhin cua minh
2-3 doan. Suy nghi CA NHAN ve cach cac tin tuc tuan nay anh huong developer Viet Nam.
- Cong nghe nao dang can hoc?
- Co hoi nao cho cong dong dev VN?
- Rui ro hay thach thuc gi can chu y?
Giong van than thien, nhu dang noi chuyen voi ban be.

RULES:
- Tieng Viet tu nhien, de hieu, KHONG dich may
- Moi tin 2-5 cau, PHAI co source link goc
- Su dung markdown: ## heading, ### sub-heading, **bold**, [text](url)
- KHONG quang cao, chi phan tich khach quan
- Uu tien nhung tin THUC SU quan trong va huu ich cho dev VN`
}

function getExcerptPrompt(contentText: string): string {
  return `Tóm tắt trong 2 câu (max 200 ký tự) nội dung chính của bản tin AI tuần này:
${contentText.slice(0, 1000)}

Chỉ trả về câu tóm tắt, không giải thích.`
}

// ---------------------------------------------------------------------------
// Draft parser
// ---------------------------------------------------------------------------

function parseDraftSections(draft: string, weekId: string) {
  const weekNum = weekId.replace(/^Y\d+W/, '')

  const titleMatch = draft.match(/^#\s+(.+)$/m)
  const title = titleMatch
    ? titleMatch[1].trim()
    : `Tuan bao Tech & AI - Tuan ${weekNum}/${YEAR}`

  const insightPattern = /## Goc nhin cua minh\s*\n([\s\S]*?)(?=\n## |\n# |$)/i
  const insightMatch = draft.match(insightPattern)
  const personalInsight = insightMatch ? insightMatch[1].trim() : ''

  let mainContent = draft
  if (insightMatch) {
    mainContent = draft.replace(insightPattern, '').trim()
  }
  if (titleMatch) {
    mainContent = mainContent.replace(/^#\s+.+\n*/, '').trim()
  }

  return { title, mainContent, personalInsight }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function backfillWeek(
  payload: any,
  week: number,
): Promise<void> {
  const weekId = getWeekId(week)
  const slug = getWeekSlug(week)
  const issue = AIGC_ISSUES[week]

  if (!issue) {
    console.log(`\n--- ${weekId}: No AIGC Weekly issue available, skipping ---`)
    return
  }

  console.log(`\n--- ${weekId} / AIGC ${issue.aigcId} (${issue.pubDate}) ---`)

  // Check if already exists
  const existing = await payload.find({
    collection: 'weekly',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    console.log(`  SKIP: ${slug} already exists (id=${existing.docs[0].id})`)
    return
  }

  let draft: string

  if (artifactsDir) {
    // Read from pre-generated artifact file
    const artifactPath = path.join(artifactsDir, `${weekId}.md`)
    if (!existsSync(artifactPath)) {
      console.log(`  SKIP: artifact file not found: ${artifactPath}`)
      return
    }
    draft = readFileSync(artifactPath, 'utf-8')
    console.log(`  Read artifact: ${artifactPath} (${draft.length} chars)`)
  } else {
    // Fetch AIGC Weekly Chinese content and translate via LLM
    const chineseContent = await fetchAigcIssue(issue.aigcId)
    console.log(`  Fetched ${chineseContent.length} chars of Chinese content`)

    console.log('  Translating + generating Vietnamese digest...')
    const prompt = getTranslationPrompt(chineseContent, weekId, issue.pubDate)
    draft = await callLLM(prompt, { maxTokens: 8192 })
  }

  // Parse sections
  const { title, mainContent, personalInsight } = parseDraftSections(draft, weekId)

  // Generate excerpt
  console.log('  Generating excerpt...')
  const excerpt = (await callLLM(getExcerptPrompt(draft), { maxTokens: 256 }))
    .trim()
    .slice(0, 300)

  // Convert to Lexical
  const contentLexical = textToLexical(mainContent)
  const insightLexical = textToLexical(personalInsight)

  // Estimate read time
  const wordCount = (mainContent + personalInsight).split(/\s+/).length
  const readTime = `${Math.max(5, Math.ceil(wordCount / 200))} min read`

  // Create in Payload
  console.log(`  Creating: "${title}"`)
  await payload.create({
    collection: 'weekly',
    data: {
      title,
      slug,
      excerpt,
      content: contentLexical,
      personalInsight: insightLexical,
      tag: 'ai-weekly',
      tagColor: 'blue',
      publishedAt: issue.pubDate,
      readTime,
      status: 'draft',
    },
  })

  console.log(`  Created as draft: ${slug}`)
}

async function main() {
  const minWeek = 1
  const maxWeek = Math.max(...Object.keys(AIGC_ISSUES).map(Number))

  // Parse positional args (skip --from-artifacts and its value)
  const positionalArgs = process.argv.slice(2).filter((_, i, arr) => {
    if (arr[i] === '--from-artifacts') return false
    if (i > 0 && arr[i - 1] === '--from-artifacts') return false
    return true
  })

  const startWeek = parseInt(positionalArgs[0] || String(minWeek), 10)
  const endWeek = parseInt(positionalArgs[1] || String(maxWeek), 10)

  if (startWeek < minWeek || endWeek > maxWeek || startWeek > endWeek) {
    console.error(`Usage: npx tsx scripts/backfill-weekly.ts [startWeek] [endWeek]`)
    console.error(`       npx tsx scripts/backfill-weekly.ts --from-artifacts <dir>`)
    console.error(`Available: W${minWeek.toString().padStart(2, '0')}-W${maxWeek.toString().padStart(2, '0')} (from AIGC Weekly)`)
    process.exit(1)
  }

  console.log(`\n=== Backfill AI Weekly${artifactsDir ? ' (from artifacts)' : ' from AIGC Weekly'} ===`)
  console.log(`Range: W${startWeek.toString().padStart(2, '0')} - W${endWeek.toString().padStart(2, '0')}`)
  if (artifactsDir) {
    console.log(`Artifacts: ${artifactsDir}`)
  } else {
    console.log(`Source: ${AIGC_BASE}`)
    console.log(`LLM: ${process.env.ANTHROPIC_BASE_URL || 'http://103.90.226.240:8317'}`)
  }
  console.log()

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  for (let week = startWeek; week <= endWeek; week++) {
    try {
      await backfillWeek(payload, week)
    } catch (error) {
      console.error(`  ERROR on W${week.toString().padStart(2, '0')}:`, error)
      console.log('  Continuing to next week...')
    }
  }

  console.log('\n=== Backfill complete ===')
  console.log('All posts saved as DRAFT. Review in Payload admin before publishing.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
