/**
 * Backfill comparison runner.
 *
 * Generates weekly digest markdown files using one of two sources:
 *   --source aigc   : Fetch from AIGC Weekly (Chinese) → translate to Vietnamese
 *   --source llm    : Generate from LLM knowledge for each week's date range
 *
 * Output: pipeline-artifacts/compare/{source}/W0X.md
 *
 * Options:
 *   --model gpt-5.3-codex   : Override the LLM model (sets env before import)
 *
 * Usage:
 *   npx tsx scripts/backfill-compare.ts --source aigc
 *   npx tsx scripts/backfill-compare.ts --source llm
 *   npx tsx scripts/backfill-compare.ts --source aigc --model gpt-5.3-codex
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Override model BEFORE importing callLLM (which reads env at call time)
const modelArg = process.argv.find(a => a.startsWith('--model='))?.split('=')[1]
  ?? (process.argv.includes('--model') ? process.argv[process.argv.indexOf('--model') + 1] : undefined)
if (modelArg) {
  process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = modelArg
}

import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { callLLM } from '../src/lib/trending/llm'

const YEAR = 2026
const AIGC_BASE = 'https://aigc-weekly.agi.li'

// ---------------------------------------------------------------------------
// AIGC issue mapping
// ---------------------------------------------------------------------------

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

function getWeekId(week: number): string {
  return `Y${String(YEAR).slice(2)}W${week.toString().padStart(2, '0')}`
}

function getWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const monday1 = new Date(jan4)
  monday1.setDate(jan4.getDate() - dayOfWeek + 1)
  const target = new Date(monday1)
  target.setDate(monday1.getDate() + (week - 1) * 7)
  return target
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// HTML → Markdown extraction (for AIGC source)
// ---------------------------------------------------------------------------

function extractContent(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')

  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  text = text.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**')
  text = text.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*')
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<[^>]+>/g, '')
  text = text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

async function fetchAigcIssue(aigcId: string): Promise<string> {
  const url = `${AIGC_BASE}/weekly/${aigcId}`
  console.log(`  Fetching: ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`)
  return extractContent(await response.text())
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

function getAigcTranslationPrompt(chineseContent: string, weekId: string, pubDate: string): string {
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
Giong van than thien, nhu dang noi chuyen voi ban be.

RULES:
- Tieng Viet tu nhien, de hieu, KHONG dich may
- Moi tin 2-5 cau, PHAI co source link goc
- Su dung markdown: ## heading, ### sub-heading, **bold**, [text](url)
- KHONG quang cao, chi phan tich khach quan
- Uu tien nhung tin THUC SU quan trong va huu ich cho dev VN`
}

function getLLMKnowledgePrompt(weekId: string, startDate: string, endDate: string): string {
  return `Ban la Hieu, mot tech blogger Viet Nam chuyen ve AI. Viet ban tin tuan ${weekId}.

IMPORTANT: This digest covers the week of ${startDate} to ${endDate} (${YEAR}).
Based on your knowledge, recall the most significant AI/ML/tech events that happened during or around this specific week.
Include real events, product launches, paper releases, model updates, and industry news.
Each item MUST have a real source URL.

STRUCTURE:
# Tuan bao Tech & AI - Tuan ${weekId}

## Mo dau
1-2 doan tom tat xu huong chinh trong tuan. Goc nhin tong quan.

## Tin tuc noi bat
### [Ten tin]
2-5 cau tom tat. Giai thich y nghia. [Nguon](url)

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
2-3 doan. Suy nghi ca nhan ve cach AI anh huong developer Viet Nam.
Giong van than thien, nhu dang noi chuyen voi ban be.

RULES:
- Tieng Viet tu nhien, de hieu
- Moi tin 2-5 cau, PHAI co source link that
- Su dung markdown: ## heading, ### sub-heading, **bold**, [text](url)
- KHONG dich may -- viet nhu nguoi Viet
- KHONG quang cao, chi phan tich khach quan
- CHI noi ve su kien THAT DA XAY RA trong tuan ${startDate} - ${endDate}`
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

async function generateFromAigc(week: number, outDir: string): Promise<void> {
  const weekId = getWeekId(week)
  const issue = AIGC_ISSUES[week]
  if (!issue) {
    console.log(`  W${week.toString().padStart(2, '0')}: No AIGC issue, skipping`)
    return
  }

  console.log(`\n[AIGC] ${weekId} / ${issue.aigcId} (${issue.pubDate})`)
  const chineseContent = await fetchAigcIssue(issue.aigcId)
  console.log(`  Fetched ${chineseContent.length} chars`)

  console.log('  Generating Vietnamese digest...')
  const draft = await callLLM(
    getAigcTranslationPrompt(chineseContent, weekId, issue.pubDate),
    { maxTokens: 8192 },
  )

  const outPath = path.join(outDir, `${weekId}.md`)
  writeFileSync(outPath, draft, 'utf-8')
  console.log(`  Saved: ${outPath} (${draft.length} chars)`)
}

async function generateFromLLM(week: number, outDir: string): Promise<void> {
  const weekId = getWeekId(week)
  const start = getWeekStart(YEAR, week)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startDate = formatDate(start)
  const endDate = formatDate(end)

  console.log(`\n[LLM] ${weekId} (${startDate} -> ${endDate})`)
  console.log('  Generating digest from LLM knowledge...')
  const draft = await callLLM(
    getLLMKnowledgePrompt(weekId, startDate, endDate),
    { maxTokens: 8192 },
  )

  const outPath = path.join(outDir, `${weekId}.md`)
  writeFileSync(outPath, draft, 'utf-8')
  console.log(`  Saved: ${outPath} (${draft.length} chars)`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const source = process.argv.find(a => a.startsWith('--source='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--source') + 1]

  if (!source || !['aigc', 'llm'].includes(source)) {
    console.error('Usage: npx tsx scripts/backfill-compare.ts --source aigc|llm')
    process.exit(1)
  }

  const modelLabel = modelArg ? `-${modelArg.replace(/[^a-z0-9.-]/gi, '')}` : ''
  const outDir = path.resolve(process.cwd(), 'pipeline-artifacts', 'compare', `${source}${modelLabel}`)
  mkdirSync(outDir, { recursive: true })

  const activeModel = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'gpt-5.3-codex'
  console.log(`\n=== Backfill Compare: source=${source} model=${activeModel} ===`)
  console.log(`Output: ${outDir}\n`)

  if (source === 'aigc') {
    const weeks = Object.keys(AIGC_ISSUES).map(Number).sort((a, b) => a - b)
    for (const week of weeks) {
      try {
        await generateFromAigc(week, outDir)
      } catch (error) {
        console.error(`  ERROR W${week.toString().padStart(2, '0')}:`, error)
      }
    }
  } else {
    // LLM knowledge: weeks 1-7
    for (let week = 1; week <= 7; week++) {
      try {
        await generateFromLLM(week, outDir)
      } catch (error) {
        console.error(`  ERROR W${week.toString().padStart(2, '0')}:`, error)
      }
    }
  }

  console.log(`\n=== Done (${source}) ===`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
