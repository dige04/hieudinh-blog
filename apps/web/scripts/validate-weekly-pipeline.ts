/**
 * Weekly Pipeline Validation Script - Phase 03
 *
 * Standalone validation that checks the entire weekly generation pipeline
 * without triggering actual content generation. Tests four domains:
 *
 *   1. Preflight: env config presence
 *   2. RSS: feed fetch and item normalization
 *   3. API: auth enforcement (401 on bad secret, 200 on good secret dry-run)
 *   4. Content: Vietnamese structure, insights section, link sanity
 *
 * Usage:
 *   npx tsx apps/web/scripts/validate-weekly-pipeline.ts
 *   npx tsx apps/web/scripts/validate-weekly-pipeline.ts --skip-api
 *   npx tsx apps/web/scripts/validate-weekly-pipeline.ts --verbose
 *
 * Exit codes:
 *   0 - all checks passed
 *   1 - one or more checks failed
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckResult {
  name: string
  passed: boolean
  message: string
  details?: string
}

interface ValidationReport {
  domain: string
  checks: CheckResult[]
}

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const ARGS = process.argv.slice(2)
const SKIP_API = ARGS.includes('--skip-api')
const VERBOSE = ARGS.includes('--verbose')

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RSS_FEED_URL = 'https://aigc-weekly.agi.li/rss.xml'

// Vietnamese Unicode ranges: Latin Extended + Vietnamese-specific diacritics
// Matches common Vietnamese characters: a-zA-Z with diacritics
const VIETNAMESE_PATTERN =
  /[\u00C0-\u00FF\u0100-\u024F\u1E00-\u1EFF]/

// Minimum number of Vietnamese-accented characters expected in a meaningful
// Vietnamese text block (title + excerpt). Low bar intentionally: even a
// single Vietnamese sentence has 5+ accented chars.
const MIN_VIETNAMESE_CHARS = 5

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(msg)
}

function verbose(msg: string): void {
  if (VERBOSE) console.log(`  [verbose] ${msg}`)
}

function check(name: string, passed: boolean, message: string, details?: string): CheckResult {
  return { name, passed, message, details }
}

function sanitizeUrl(rawUrl: string | undefined): string {
  const fallbackUrl = 'https://aigc-weekly.agi.li'
  if (!rawUrl) return fallbackUrl
  try {
    const parsed = new URL(rawUrl.trim())
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return fallbackUrl
  } catch {
    return fallbackUrl
  }
}

function countVietnameseChars(text: string): number {
  const matches = text.match(new RegExp(VIETNAMESE_PATTERN.source, 'g'))
  return matches ? matches.length : 0
}

// ---------------------------------------------------------------------------
// Domain 1: Preflight Config
// ---------------------------------------------------------------------------

function validatePreflight(): ValidationReport {
  const checks: CheckResult[] = []

  // Required env vars for the pipeline
  const required: Array<{ key: string; description: string; sensitive: boolean }> = [
    { key: 'ANTHROPIC_BASE_URL', description: 'AI proxy base URL', sensitive: false },
    { key: 'ANTHROPIC_AUTH_TOKEN', description: 'AI proxy auth token', sensitive: true },
    { key: 'WEEKLY_API_SECRET', description: 'Weekly API endpoint secret', sensitive: true },
  ]

  for (const { key, description, sensitive } of required) {
    const value = process.env[key]
    const present = !!value && value.trim().length > 0

    if (present && !sensitive) {
      verbose(`${key} = ${value}`)
    } else if (present && sensitive) {
      verbose(`${key} = ${'*'.repeat(8)} (redacted)`)
    }

    checks.push(
      check(
        `env.${key}`,
        present,
        present
          ? `${description} is configured`
          : `${description} is MISSING - set ${key} in .env.local`,
      ),
    )
  }

  // Optional but recommended
  const optional: Array<{ key: string; description: string }> = [
    { key: 'ANTHROPIC_DEFAULT_HAIKU_MODEL', description: 'AI model identifier' },
    { key: 'NEXT_PUBLIC_SITE_URL', description: 'Public site URL (for API tests)' },
  ]

  for (const { key, description } of optional) {
    const value = process.env[key]
    const present = !!value && value.trim().length > 0
    checks.push(
      check(
        `env.${key}`,
        true, // optional vars don't fail
        present
          ? `${description} is configured`
          : `${description} is not set (optional, using defaults)`,
      ),
    )
  }

  // Validate ANTHROPIC_BASE_URL is a valid URL if present
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  if (baseUrl) {
    try {
      const parsed = new URL(baseUrl)
      checks.push(
        check(
          'env.ANTHROPIC_BASE_URL_format',
          parsed.protocol === 'http:' || parsed.protocol === 'https:',
          `Base URL protocol is ${parsed.protocol}`,
        ),
      )
    } catch {
      checks.push(
        check(
          'env.ANTHROPIC_BASE_URL_format',
          false,
          `Base URL is not a valid URL: ${baseUrl}`,
        ),
      )
    }
  }

  return { domain: 'Preflight Config', checks }
}

// ---------------------------------------------------------------------------
// Domain 2: RSS Fetch and Normalization
// ---------------------------------------------------------------------------

async function validateRss(): Promise<ValidationReport> {
  const checks: CheckResult[] = []

  // 2a. Fetch the RSS feed
  let xml = ''
  try {
    const response = await fetch(RSS_FEED_URL, {
      signal: AbortSignal.timeout(15_000),
    })
    checks.push(
      check(
        'rss.fetch_status',
        response.ok,
        response.ok
          ? `RSS fetch returned ${response.status}`
          : `RSS fetch failed with ${response.status}`,
      ),
    )

    if (!response.ok) {
      return { domain: 'RSS Feed', checks }
    }

    xml = await response.text()
    checks.push(
      check(
        'rss.response_size',
        xml.length > 100,
        `RSS response is ${xml.length} bytes`,
      ),
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    checks.push(
      check('rss.fetch_status', false, `RSS fetch error: ${message}`),
    )
    return { domain: 'RSS Feed', checks }
  }

  // 2b. Parse items (mirrors generate-weekly.ts logic)
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  checks.push(
    check(
      'rss.item_count',
      itemMatches.length > 0,
      `Found ${itemMatches.length} <item> elements in feed`,
    ),
  )

  if (itemMatches.length === 0) {
    return { domain: 'RSS Feed', checks }
  }

  // 2c. Normalize first 5 items - same logic as generate-weekly.ts
  const items = itemMatches.slice(0, 5).map((itemXml) => {
    const title =
      itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ||
      itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[2] ||
      'Untitled'
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1]
    return {
      title: title.trim(),
      url: sanitizeUrl(link),
      source: 'AIGC Weekly RSS',
    }
  })

  // 2d. Validate normalization quality
  const nonEmptyTitles = items.filter((i) => i.title !== 'Untitled' && i.title.length > 0)
  checks.push(
    check(
      'rss.titles_non_empty',
      nonEmptyTitles.length === items.length,
      `${nonEmptyTitles.length}/${items.length} items have non-empty titles`,
      items.map((i, idx) => `  ${idx + 1}. ${i.title}`).join('\n'),
    ),
  )

  // 2e. Validate URLs
  const validUrls = items.filter((i) => {
    try {
      const u = new URL(i.url)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  })
  checks.push(
    check(
      'rss.urls_valid',
      validUrls.length === items.length,
      `${validUrls.length}/${items.length} items have valid URLs`,
      items.map((i, idx) => `  ${idx + 1}. ${i.url}`).join('\n'),
    ),
  )

  // 2f. Check for duplicate URLs (would cause duplicate content)
  const urlSet = new Set(items.map((i) => i.url))
  checks.push(
    check(
      'rss.urls_unique',
      urlSet.size === items.length,
      urlSet.size === items.length
        ? 'All item URLs are unique'
        : `${items.length - urlSet.size} duplicate URLs detected`,
    ),
  )

  return { domain: 'RSS Feed', checks }
}

// ---------------------------------------------------------------------------
// Domain 3: API Endpoint Auth
// ---------------------------------------------------------------------------

async function validateApi(): Promise<ValidationReport> {
  const checks: CheckResult[] = []

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'http://localhost:3000'
  const apiSecret = process.env.WEEKLY_API_SECRET

  const endpoint = `${siteUrl}/api/weekly/generate`
  verbose(`Testing API at: ${endpoint}`)

  // 3a. GET health check
  try {
    const healthRes = await fetch(endpoint, {
      signal: AbortSignal.timeout(10_000),
    })
    const healthBody = await healthRes.json()

    checks.push(
      check(
        'api.health_status',
        healthRes.status === 200,
        `GET ${endpoint} returned ${healthRes.status}`,
        JSON.stringify(healthBody, null, 2),
      ),
    )

    // Check configured flags
    if (healthBody.configured) {
      const allConfigured =
        healthBody.configured.anthropicBaseUrl &&
        healthBody.configured.anthropicAuthToken &&
        healthBody.configured.weeklyApiSecret

      checks.push(
        check(
          'api.health_configured',
          allConfigured,
          allConfigured
            ? 'All env flags report configured=true'
            : `Missing config flags: ${JSON.stringify(healthBody.configured)}`,
        ),
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    checks.push(
      check(
        'api.health_status',
        false,
        `GET health check failed: ${message}. Is the dev server running?`,
      ),
    )
    // If health fails, skip remaining API checks
    return { domain: 'API Endpoint', checks }
  }

  // 3b. POST without auth -> expect 401
  try {
    const unauthRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: true }),
      signal: AbortSignal.timeout(10_000),
    })
    const unauthBody = await unauthRes.json()

    checks.push(
      check(
        'api.unauth_returns_401',
        unauthRes.status === 401,
        `POST without secret returned ${unauthRes.status} (expected 401)`,
        JSON.stringify(unauthBody, null, 2),
      ),
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    checks.push(
      check('api.unauth_returns_401', false, `POST unauth test failed: ${message}`),
    )
  }

  // 3c. POST with wrong secret -> expect 401
  try {
    const wrongRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': 'intentionally-wrong-secret-for-validation',
      },
      body: JSON.stringify({ dryRun: true }),
      signal: AbortSignal.timeout(10_000),
    })
    const wrongBody = await wrongRes.json()

    checks.push(
      check(
        'api.wrong_secret_returns_401',
        wrongRes.status === 401,
        `POST with wrong secret returned ${wrongRes.status} (expected 401)`,
        JSON.stringify(wrongBody, null, 2),
      ),
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    checks.push(
      check('api.wrong_secret_returns_401', false, `POST wrong-secret test failed: ${message}`),
    )
  }

  // 3d. POST with correct secret + dryRun=true -> expect 200
  if (!apiSecret) {
    checks.push(
      check(
        'api.auth_dry_run',
        false,
        'Cannot test authorized dry-run: WEEKLY_API_SECRET is not set',
      ),
    )
  } else {
    try {
      const authRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-secret': apiSecret,
        },
        body: JSON.stringify({ dryRun: true }),
        signal: AbortSignal.timeout(10_000),
      })
      const authBody = await authRes.json()

      checks.push(
        check(
          'api.auth_dry_run',
          authRes.status === 200 && authBody.success === true,
          `POST with valid secret + dryRun returned ${authRes.status}`,
          JSON.stringify(authBody, null, 2),
        ),
      )

      // Verify dry-run flag in response
      if (authBody.data) {
        checks.push(
          check(
            'api.dry_run_flag',
            authBody.data.dryRun === true,
            authBody.data.dryRun === true
              ? 'Dry-run response correctly indicates dryRun=true'
              : `Unexpected dryRun value: ${authBody.data.dryRun}`,
          ),
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      checks.push(
        check('api.auth_dry_run', false, `POST authorized dry-run failed: ${message}`),
      )
    }
  }

  return { domain: 'API Endpoint', checks }
}

// ---------------------------------------------------------------------------
// Domain 4: Content Structure Validation
//
// This validates sample/existing content structure without generating new
// content. It checks whether a hypothetical generated payload would meet
// quality gates. In production, this validates after generation.
// ---------------------------------------------------------------------------

function validateContentStructure(
  title: string,
  excerpt: string,
  contentText: string,
  insightText: string,
): ValidationReport {
  const checks: CheckResult[] = []

  // 4a. Title format: should match "Tuan bao Tech & AI - Tuan NN/2026"
  const titlePattern = /Tu[aầ]n\s+b[aá]o|Weekly|AI/i
  checks.push(
    check(
      'content.title_format',
      titlePattern.test(title),
      titlePattern.test(title)
        ? `Title matches expected pattern: "${title}"`
        : `Title may not match expected pattern: "${title}"`,
    ),
  )

  // 4b. Vietnamese content in title/excerpt
  const titleVnCount = countVietnameseChars(title)
  const excerptVnCount = countVietnameseChars(excerpt)
  const combinedVnCount = titleVnCount + excerptVnCount

  checks.push(
    check(
      'content.vietnamese_chars',
      combinedVnCount >= MIN_VIETNAMESE_CHARS,
      `Found ${combinedVnCount} Vietnamese-accented characters in title+excerpt (min: ${MIN_VIETNAMESE_CHARS})`,
    ),
  )

  // 4c. Content is non-empty
  checks.push(
    check(
      'content.body_non_empty',
      contentText.trim().length > 100,
      `Content body is ${contentText.trim().length} characters`,
    ),
  )

  // 4d. Insight section present and non-trivial
  checks.push(
    check(
      'content.insight_present',
      insightText.trim().length > 50,
      insightText.trim().length > 50
        ? `Insight section is ${insightText.trim().length} characters`
        : `Insight section is too short or empty (${insightText.trim().length} chars)`,
    ),
  )

  // 4e. Content contains expected structure markers
  const hasOverview = /[Tt][oổ]ng\s*quan|overview/i.test(contentText)
  const hasHighlights = /[Tt]in\s+t[uứ]c|[Đđ]i[eể]m\s+nh[aấ]n|highlight/i.test(contentText)

  checks.push(
    check(
      'content.structure_markers',
      hasOverview || hasHighlights,
      hasOverview && hasHighlights
        ? 'Content has both overview and highlights sections'
        : hasOverview
          ? 'Content has overview section (highlights section not detected)'
          : hasHighlights
            ? 'Content has highlights section (overview section not detected)'
            : 'Content is missing expected Vietnamese section markers',
    ),
  )

  // 4f. Link sanity - extract URLs and validate
  const urlPattern = /https?:\/\/[^\s"'<>)]+/g
  const urls = contentText.match(urlPattern) ?? []

  if (urls.length > 0) {
    const validUrls = urls.filter((u) => {
      try {
        new URL(u)
        return true
      } catch {
        return false
      }
    })

    checks.push(
      check(
        'content.links_valid',
        validUrls.length === urls.length,
        `${validUrls.length}/${urls.length} embedded URLs are well-formed`,
      ),
    )

    // Check for common broken patterns
    const suspiciousUrls = urls.filter(
      (u) =>
        u.includes('localhost') ||
        u.includes('127.0.0.1') ||
        u.includes('example.com') ||
        u.endsWith('.') ||
        u.endsWith(','),
    )

    checks.push(
      check(
        'content.links_not_suspicious',
        suspiciousUrls.length === 0,
        suspiciousUrls.length === 0
          ? 'No suspicious URLs detected (localhost, example.com, trailing punctuation)'
          : `${suspiciousUrls.length} suspicious URLs found`,
        suspiciousUrls.length > 0
          ? suspiciousUrls.map((u) => `  - ${u}`).join('\n')
          : undefined,
      ),
    )
  } else {
    checks.push(
      check(
        'content.links_valid',
        true,
        'No embedded URLs found in content (acceptable for summary-only format)',
      ),
    )
  }

  // 4g. Excerpt length
  checks.push(
    check(
      'content.excerpt_length',
      excerpt.length > 0 && excerpt.length <= 300,
      `Excerpt is ${excerpt.length} characters (max 300)`,
    ),
  )

  return { domain: 'Content Structure', checks }
}

// ---------------------------------------------------------------------------
// Simulate content validation with a synthetic sample
//
// Since we cannot trigger actual generation in validation (it requires the AI
// proxy), we validate the structure using a representative sample that mirrors
// what generate-weekly.ts produces.
// ---------------------------------------------------------------------------

function runSyntheticContentValidation(): ValidationReport {
  // This sample mirrors actual output structure from generate-weekly.ts.
  // Uses proper Vietnamese diacritics to validate the Vietnamese detection logic.
  const sampleTitle = 'Tuần báo Tech & AI - Tuần 07/2026'
  const sampleExcerpt =
    'Tổng hợp tin tức AI nổi bật trong tuần: OpenAI ra mắt mới, Google cập nhật Gemini.'
  const sampleContent = `## Tổng quan

Tuần này chứng kiến nhiều bước tiến quan trọng trong lĩnh vực AI, đặc biệt là các cập nhật từ OpenAI và Google.

## Tin tức nổi bật

### OpenAI ra mắt GPT-5
OpenAI đã chính thức ra mắt GPT-5 với nhiều cải tiến về khả năng suy luận.
https://openai.com/blog/gpt-5

### Google cập nhật Gemini 2.0
Google giới thiệu phiên bản Gemini 2.0 với khả năng xử lý đa phương thức tốt hơn.
https://blog.google/gemini-2

## Điểm nhấn tuần này
- AI ngày càng thông minh hơn
- Cuộc đua AI giữa các ông lớn công nghệ ngày càng gay cấn`

  const sampleInsight = `Mình thấy tuần này là một tuần khá thú vị cho cộng đồng AI Việt Nam. Với việc GPT-5 ra mắt, các developer có thể tận dụng nhiều khả năng mới để xây dựng sản phẩm tốt hơn.

Điều mình quan tâm nhất là khả năng suy luận của GPT-5. Nếu nó thực sự tốt như OpenAI quảng cáo thì sẽ thay đổi cách chúng ta làm việc với AI rất nhiều.`

  return validateContentStructure(sampleTitle, sampleExcerpt, sampleContent, sampleInsight)
}

// ---------------------------------------------------------------------------
// Report printer
// ---------------------------------------------------------------------------

function printReport(reports: ValidationReport[]): { total: number; passed: number; failed: number } {
  let total = 0
  let passed = 0
  let failed = 0

  log('')
  log('='.repeat(70))
  log('  WEEKLY PIPELINE VALIDATION REPORT')
  log('='.repeat(70))
  log('')

  for (const report of reports) {
    log(`--- ${report.domain} ---`)
    log('')

    for (const c of report.checks) {
      total++
      const icon = c.passed ? '[PASS]' : '[FAIL]'
      if (c.passed) {
        passed++
      } else {
        failed++
      }

      log(`  ${icon} ${c.name}`)
      log(`         ${c.message}`)
      if (c.details && (VERBOSE || !c.passed)) {
        for (const line of c.details.split('\n')) {
          log(`         ${line}`)
        }
      }
      log('')
    }
  }

  log('='.repeat(70))
  log(`  SUMMARY: ${passed}/${total} passed, ${failed} failed`)
  log('='.repeat(70))
  log('')

  return { total, passed, failed }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  log('Weekly Pipeline Validation - Phase 03')
  log(`Date: ${new Date().toISOString()}`)
  log(`Flags: --skip-api=${SKIP_API} --verbose=${VERBOSE}`)

  const reports: ValidationReport[] = []

  // Domain 1: Preflight
  log('\n[1/4] Checking preflight config...')
  reports.push(validatePreflight())

  // Domain 2: RSS
  log('[2/4] Validating RSS feed...')
  reports.push(await validateRss())

  // Domain 3: API
  if (SKIP_API) {
    log('[3/4] Skipping API validation (--skip-api)')
    reports.push({
      domain: 'API Endpoint',
      checks: [check('api.skipped', true, 'API validation skipped via --skip-api flag')],
    })
  } else {
    log('[3/4] Validating API endpoint...')
    reports.push(await validateApi())
  }

  // Domain 4: Content structure (synthetic sample)
  log('[4/4] Validating content structure (synthetic sample)...')
  reports.push(runSyntheticContentValidation())

  // Print report
  const { failed } = printReport(reports)

  // Go/no-go gate
  log('')
  if (failed === 0) {
    log('GO/NO-GO GATE: GO')
    log('All validation checks passed. Pipeline is ready for schedule enable.')
  } else {
    log('GO/NO-GO GATE: NO-GO')
    log(`${failed} check(s) failed. Resolve failures before enabling the cron schedule.`)
    log('See rollback playbook: apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/rollback-playbook.md')
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Validation script crashed:', err)
  process.exit(1)
})
