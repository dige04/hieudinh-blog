# Vietnamese AI Weekly Pipeline Upgrade

Date: 2026-02-17 | Status: Draft | Branch: `feat/weekly-pipeline-v2`

## Executive Summary

Upgrade the existing 5-phase weekly digest pipeline to match miantiao-me/aigc-weekly quality standards while keeping the current stack: GitHub Actions trigger, Payload CMS (Lexical richtext), and LLM proxy at VPS. The upgrade focuses on 6 key gaps: content scraping, expanded source list, writing style guide, review loop improvements, proper Markdown-to-Lexical conversion, and artifact-based checkpoints hardening.

Estimated effort: ~4 working sessions (16-20 hours).

---

## Gap Analysis: Current vs Target

| Dimension | Current State | Target (aigc-weekly pattern) | Gap Severity |
|-----------|--------------|------------------------------|--------------|
| **Phase 1: Research** | RSS feeds + HN API + GitHub HTML scraping + X API. Only fetches titles/summaries from RSS XML. No deep scraping. | Firecrawl MCP: 2-layer deep crawl, 30 req/source, full article extraction | HIGH |
| **Source List** | 5 RSS feeds (AIGC Weekly RSS, TLDR AI, 3x ArXiv). HN top-30. GitHub trending HTML. X search. | 30+ curated sources across 3 tiers (Important, Blogs, KOLs) | HIGH |
| **Content Depth** | RSS items have titles + short descriptions only. No full article body. | Full article text extracted via scraper. 2-5 sentence summaries written from actual content | HIGH |
| **Phase 2: Scoring** | Exists in both `scorer.ts` (daily) and `pipeline.ts` (weekly). 3-dimension matrix with threshold 70. Dedup against previous weekly URLs | Identical scoring matrix. Additionally: GitHub star floor (100), star surge auto-pass, category taxonomy | LOW |
| **Phase 3: Writing** | Vietnamese prompt in `prompts.ts`. Basic structure. No anti-AI-writing rules | chinese-writing skill with explicit de-AI-ification rules, link embedding rules, emoji guidelines | MEDIUM |
| **Phase 4: Review** | Max 2 iterations. Review prompt checks 7 criteria. Revision loop exists | Max 3 iterations. Identical concept, but more specific critique format | LOW |
| **Phase 5: Publish** | Payload CMS upsert by slug. Lexical conversion exists but is naive -- strips all markdown formatting to plain paragraphs | Payload REST API upsert by issueNumber. Uses plain textarea (no Lexical), stores raw MD | MEDIUM |
| **textToLexical** | Strips headings, links, bold, lists -- converts everything to plain `paragraph` nodes | N/A (aigc-weekly uses textarea, not Lexical) | HIGH |
| **Artifact Recovery** | Exists. File-based checkpoints per phase. Works | Same pattern. Well-implemented | NONE |
| **Cost Tracking** | `cost-tracker.ts` exists, logs to JSONL. Not integrated into weekly pipeline LLM calls | No equivalent (aigc-weekly uses paid agent APIs directly) | LOW |
| **Vietnamese Style** | Prompt says "viet nhu nguoi Viet" but no detailed style guide | chinese-writing skill has 20+ specific rules | MEDIUM |

### Critical Gaps (must fix)

1. **Content scraping**: RSS items lack full article text. LLM writes summaries from titles + 300-char descriptions, producing shallow content. Need article body extraction.
2. **Source list**: Only 5 RSS feeds + HN + GitHub + X. Missing major AI blogs (Anthropic, OpenAI, DeepMind, etc.), Vietnamese dev sources, and KOL newsletters.
3. **textToLexical**: Destroys all markdown formatting. Headings become paragraphs, links lose URLs, bold/italic stripped. Output in Payload CMS is a wall of plain text.

### Medium Gaps (should fix)

4. **Writing style guide**: No explicit anti-AI-writing rules. No link embedding guidelines. No section length constraints.
5. **Vietnamese quality**: Prompts use non-diacritical Vietnamese (e.g., "Tuan bao" not "Tuan bao"). No guidance on tone consistency.

### Low Gaps (nice to have)

6. **GitHub star floor**: Not enforced in weekly pipeline (exists in daily scorer but not in weekly re-rank).
7. **Cost tracking integration**: `callLLM` logs token usage but `cost-tracker.ts` is not called from the weekly pipeline.
8. **Review iterations**: 2 max vs 3 max -- marginal difference.

---

## Implementation Plan

### Phase 0: Source List Expansion + Configuration
**Files**: New `apps/web/src/lib/weekly/sources.ts`
**Effort**: 2h

Create a curated source registry for the Vietnamese AI weekly, modeled on aigc-weekly's REFERENCE.md but adapted for Vietnamese dev audience.

```typescript
// apps/web/src/lib/weekly/sources.ts
export interface WeeklySource {
  url: string
  name: string
  tier: 1 | 2 | 3  // Priority tier for batch ordering
  type: 'rss' | 'web' | 'api'
  scrapeDepth: 0 | 1 | 2  // 0=RSS only, 1=article page, 2=link follow
  aiRelevanceFilter: boolean  // Apply keyword filter
}

export const WEEKLY_SOURCES: WeeklySource[] = [
  // Tier 1: Critical aggregators (run first)
  { url: 'https://news.ycombinator.com/front', name: 'Hacker News Front', tier: 1, type: 'web', scrapeDepth: 1, aiRelevanceFilter: true },
  { url: 'https://news.ycombinator.com/show', name: 'Show HN', tier: 1, type: 'web', scrapeDepth: 1, aiRelevanceFilter: true },
  { url: 'https://tldr.tech/ai/rss', name: 'TLDR AI', tier: 1, type: 'rss', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://daily.dev/', name: 'daily.dev AI', tier: 1, type: 'web', scrapeDepth: 1, aiRelevanceFilter: true },
  { url: 'https://github.com/trending', name: 'GitHub Trending', tier: 1, type: 'web', scrapeDepth: 0, aiRelevanceFilter: true },

  // Tier 2: Company blogs
  { url: 'https://www.anthropic.com/research', name: 'Anthropic Research', tier: 2, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://www.anthropic.com/engineering', name: 'Anthropic Engineering', tier: 2, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://openai.com/blog', name: 'OpenAI Blog', tier: 2, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://deepmind.google/discover/blog/', name: 'DeepMind Blog', tier: 2, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://blog.google/technology/ai/', name: 'Google AI Blog', tier: 2, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://ai.meta.com/blog/', name: 'Meta AI Blog', tier: 2, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://arxiv.org/list/cs.AI/recent', name: 'ArXiv cs.AI', tier: 2, type: 'web', scrapeDepth: 0, aiRelevanceFilter: false },
  { url: 'https://arxiv.org/list/cs.CL/recent', name: 'ArXiv cs.CL', tier: 2, type: 'web', scrapeDepth: 0, aiRelevanceFilter: false },
  { url: 'https://hackernoon.com/tagged/ai', name: 'HackerNoon AI', tier: 2, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://huggingface.co/blog', name: 'Hugging Face Blog', tier: 2, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },

  // Tier 3: KOL newsletters + Vietnamese sources
  { url: 'https://www.latent.space/', name: 'Latent Space', tier: 3, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://bensbites.beehiiv.com/', name: "Ben's Bites", tier: 3, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://www.oneusefulthing.org/', name: 'One Useful Thing', tier: 3, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://www.interconnects.ai/', name: 'Interconnects', tier: 3, type: 'web', scrapeDepth: 1, aiRelevanceFilter: false },
  { url: 'https://aigc-weekly.agi.li/rss.xml', name: 'AIGC Weekly', tier: 3, type: 'rss', scrapeDepth: 0, aiRelevanceFilter: false },
]
```

**Decisions**:
- Keep existing HN/GitHub/X clients as-is for daily pipeline
- Weekly pipeline uses this expanded list with web scraping
- Vietnamese dev-specific sources (viblo.asia, etc.) can be added later once scraping works

---

### Phase 1: Content Scraper Module
**Files**: New `apps/web/src/lib/weekly/scraper.ts`
**Effort**: 4h | **Dependency**: Phase 0

Replace shallow RSS-only collection with a proper web scraper for full article extraction. No Firecrawl dependency -- use `fetch` + HTML-to-text extraction (like the existing `extractContent` in `generate-weekly.ts`).

#### Architecture

```
scraper.ts
  ├── fetchPage(url)         -- fetch HTML with timeout + retry
  ├── extractArticleText()   -- HTML → clean markdown text
  ├── extractLinks()         -- find article links from index pages
  ├── scrapeSource()         -- orchestrate: fetch page → extract links → fetch articles
  └── scrapeAllSources()     -- batch sources by tier, parallel within tier
```

#### Key design decisions

1. **No external scraping service**: Use native `fetch` + regex/string parsing (same pattern as existing `github-client.ts` and `rss-client.ts`). KISS.
2. **Readability extraction**: Port the existing `extractContent()` from `generate-weekly.ts` into a shared utility. Enhance with:
   - `<article>` / `<main>` tag detection (prefer content inside these)
   - `<meta property="og:description">` extraction as fallback summary
   - Content length sanity check (skip pages < 200 chars after extraction)
3. **Rate limiting**: Max 3 concurrent fetches per domain, 1s delay between requests to same domain. Implemented via a simple semaphore Map.
4. **Depth control**: `scrapeDepth: 0` = just parse the page as-is. `scrapeDepth: 1` = if the page looks like a listing (multiple `<a>` tags in `<article>` elements), extract links and fetch each. Cap at 10 articles per source.
5. **Output**: Array of `ScrapedArticle` objects:

```typescript
interface ScrapedArticle {
  url: string
  title: string
  content: string      // Full extracted text (max 5000 chars)
  sourceName: string
  publishedAt?: string // Extracted from meta tags or page content
  scrapedAt: string
}
```

#### Integration with pipeline

Phase 1 (AGGREGATE) in `pipeline.ts` currently queries DailyTrending from Payload CMS. The upgrade adds a **parallel scraping step**:

```
Phase 1 (AGGREGATE):
  ├── [existing] Query 7 days of DailyTrending from Payload CMS
  ├── [NEW] Scrape WEEKLY_SOURCES for current week's content
  ├── Merge both sets
  ├── Dedup (existing deduplicateItems)
  └── Save artifact
```

This keeps backward compatibility: if DailyTrending has data, it supplements the scraped content. If DailyTrending is empty, scraping alone provides content.

---

### Phase 2: Improved Scoring & Filtering
**Files**: Modify `apps/web/src/lib/weekly/prompts.ts`, `apps/web/src/lib/weekly/pipeline.ts`
**Effort**: 2h | **Dependency**: Phase 1

#### Changes to scoring prompt (`getScoringPrompt`)

1. **Add content field**: Currently sends only `summary ?? content?.slice(0, 300)`. With full article text from scraper, send `content.slice(0, 800)` for better scoring accuracy.
2. **GitHub star floor**: Add rule to prompt: "GitHub repositories with < 100 stars: auto-score 0 unless trending (> 50 stars today)."
3. **Category taxonomy**: Change from `tin-tuc | mo-hinh | cong-cu | nghien-cuu` to `tin-tuc | mo-hinh | cong-cu | nghien-cuu | huong-dan` (add tutorials).
4. **Penalty for stale content**: Add rule: "Content older than 14 days from current date gets 0.5x penalty."

#### Changes to pipeline.ts

1. **Merge scraped items with DailyTrending**: Convert `ScrapedArticle[]` to `TrendingItem[]` before merging.
2. **Increase MAX_AGGREGATE_ITEMS**: 200 -> 300 (more sources = more candidates).
3. **Increase TOP_ITEMS_COUNT**: 20 -> 25 (25 items allows for richer digest sections).

---

### Phase 3: Vietnamese Writing Style Guide
**Files**: New `apps/web/src/lib/weekly/style-guide.ts`, modify `apps/web/src/lib/weekly/prompts.ts`
**Effort**: 3h | **Dependency**: None (can be done in parallel with Phase 1)

Create the Vietnamese equivalent of aigc-weekly's `chinese-writing` skill. This is a system prompt module injected into the writing and review phases.

#### Style guide content

```typescript
// apps/web/src/lib/weekly/style-guide.ts
export const VIETNAMESE_STYLE_GUIDE = `
## Van phong viet (Writing Style Guide)

### Nguyen tac chung
1. Viet tu nhien nhu dang noi chuyen voi dong nghiep developer
2. KHONG dich may -- neu can tham khao nguon tieng Anh, viet lai bang cach hieu cua minh
3. Uu tien su dung tieng Viet khi co the. Giu nguyen thuat ngu ky thuat pho bien bang tieng Anh (model, API, framework, fine-tune, RAG, agent...)
4. KHONG viet hoa toan bo tu (VD: "KHONG" chi dung trong rules, khong dung trong bai viet)

### Chong van phong AI (De-AI-ification Rules)
CAM SU DUNG cac cum tu sau -- day la dau hieu cua van phong may:
- "dang chu y" / "noi bat" / "an tuong" (qua chung chung)
- "khong the phu nhan" / "khong the bo qua"
- "mot buoc tien lon" / "buoc dot pha"
- "thay doi cuoc choi" / "game changer" (ngoai tru khi dung ironically)
- "trong boi canh hien nay" / "trong thoi dai AI"
- Bat ky cau nao bat dau bang "Voi su phat trien cua..."

THAY THE bang:
- Mo ta cu the: "GPT-5 nhanh hon 3x so voi GPT-4 trong benchmark X"
- So sanh truc tiep: "Khac voi Llama 3 dung 8B params, mo hinh nay chi can 2B"
- Y kien ca nhan: "Minh thay cai nay hay vi..." / "Thu nghiem thi thay..."

### Lien ket (Link Rules)
1. LUON gan source link inline: [ten cong cu](url) hoac [doc them](url)
2. KHONG tao dong rieng "Nguon:" hay "Link:" -- phai nhung vao cau van
3. Moi tin/item PHAI co it nhat 1 link
4. VD dung: "Google vua ra [Gemini 3 Flash](url) voi context window 2M tokens"
5. VD sai: "Google vua ra Gemini 3 Flash voi context window 2M tokens. Nguon: url"

### Do dai
- Mo dau: 2-3 cau (khong phai 2-3 doan)
- Moi tin/item: 2-5 cau summary + personal take
- Ket luan: 3-5 bullet points
- Goc nhin ca nhan: 2-3 doan ngan
- Tong bai: 1500-3000 tu

### Giong dieu
- Than thien nhung chuyen nghiep -- giong anh/chi senior dev noi chuyen voi team
- Co the dung humor nhe nhang, VD: "Neu ban chua kip doc paper tuan truoc thi tuan nay co them 5 cai nua"
- KHONG dung emoji trong heading. Emoji OK trong body text (toi da 3 per section)
- KHONG marketing: khong "must-have", "amazing", "best tool ever"
`
```

#### Writing prompt changes

Inject `VIETNAMESE_STYLE_GUIDE` as system prompt prefix in both `getWritingPrompt` and `getReviewPrompt`.

Current writing prompt structure:
```
Ban la Hieu, mot tech blogger Viet Nam chuyen ve AI. Viet ban tin tuan ${weekId}.
ITEMS: ...
STRUCTURE: ...
RULES: ...
```

New structure:
```
[SYSTEM: VIETNAMESE_STYLE_GUIDE]

Ban la Hieu, mot tech blogger Viet Nam chuyen ve AI. Viet ban tin tuan ${weekId}.
ITEMS (each item now includes full article content, not just title):
  - [score] Title (category) url
    Content snippet: ...
STRUCTURE: ...
RULES: (remove duplicates with style guide, keep only pipeline-specific rules)
```

---

### Phase 4: Proper Markdown-to-Lexical Converter
**Files**: Rewrite `apps/web/src/lib/weekly/shared.ts` `textToLexical()`
**Effort**: 4h | **Dependency**: None (can be done in parallel)

The current `textToLexical` is the most critical bug -- it destroys all formatting.

#### Current behavior (broken)

```typescript
// Strips ALL markdown, produces flat paragraph nodes
.replace(/^#{1,6}\s+/, '')     // removes headings
.replace(/\*\*([^*]+)\*\*/g, '$1') // removes bold
.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // removes links (loses URLs!)
```

#### Target behavior

Convert markdown to proper Lexical JSON nodes:
- `# Title` -> `{ type: 'heading', tag: 'h1', children: [...] }`
- `## Subtitle` -> `{ type: 'heading', tag: 'h2', children: [...] }`
- `**bold**` -> `{ type: 'text', format: 1, text: '...' }`
- `[text](url)` -> `{ type: 'link', url: '...', children: [{ type: 'text', text: '...' }] }`
- `- item` -> `{ type: 'list', listType: 'bullet', children: [{ type: 'listitem', ... }] }`
- Plain text -> `{ type: 'paragraph', children: [{ type: 'text', text: '...' }] }`

#### Implementation approach

Use a **line-by-line parser** (not regex-replace). Process each line:

```typescript
function textToLexical(markdown: string): LexicalRoot {
  const lines = markdown.split('\n')
  const children: LexicalNode[] = []
  let currentList: LexicalNode | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      // Flush any open list
      if (currentList) { children.push(currentList); currentList = null }
      continue
    }

    // Heading detection
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      if (currentList) { children.push(currentList); currentList = null }
      const level = headingMatch[1].length
      children.push(makeHeading(level, parseInline(headingMatch[2])))
      continue
    }

    // List item detection
    const listMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (listMatch) {
      if (!currentList) currentList = makeList('bullet')
      currentList.children!.push(makeListItem(parseInline(listMatch[1])))
      continue
    }

    // Paragraph
    if (currentList) { children.push(currentList); currentList = null }
    children.push(makeParagraph(parseInline(trimmed)))
  }

  if (currentList) children.push(currentList)
  return wrapRoot(children)
}
```

The `parseInline()` function handles inline formatting within a line:
- Split on `**`, `[text](url)`, `*text*` patterns
- Return array of text/link/formatted nodes

#### Testing

Create `apps/web/src/lib/weekly/__tests__/shared.test.ts` with cases:
1. Heading levels 1-6
2. Bold text within paragraph
3. Links with URLs preserved
4. Bullet lists
5. Mixed content (heading -> paragraphs -> list -> heading)
6. Edge cases: empty input, no markdown, nested formatting

---

### Phase 5: Review Loop Enhancement
**Files**: Modify `apps/web/src/lib/weekly/pipeline.ts`, `apps/web/src/lib/weekly/prompts.ts`
**Effort**: 1.5h | **Dependency**: Phase 3 (style guide)

#### Changes

1. **MAX_REVIEW_ITERATIONS**: 2 -> 3 (match aigc-weekly)
2. **Review prompt**: Inject `VIETNAMESE_STYLE_GUIDE` so reviewer checks against same rules
3. **Structured critique format**: Change review output from free-text to structured:

```
RESPOND WITH EXACTLY ONE OF:
A) "PASS"
B) JSON critique:
[
  {
    "criterion": "de-ai-ification",
    "section": "## Mo hinh & Nghien cuu",
    "issue": "Uses 'buoc dot pha' which is banned phrase",
    "fix": "Replace with specific metric comparison"
  }
]
```

4. **Revision prompt**: Include the structured critique directly so writer can address each point.

---

### Phase 6: Pipeline Integration & Wiring
**Files**: Modify `apps/web/src/lib/weekly/pipeline.ts`
**Effort**: 3h | **Dependency**: Phases 1-5

#### Updated pipeline flow

```
Phase 1: AGGREGATE (enhanced)
  ├── [existing] Query DailyTrending from Payload CMS
  ├── [NEW] scrapeAllSources(WEEKLY_SOURCES)
  ├── [NEW] Convert ScrapedArticle[] to TrendingItem[]
  ├── Merge both sets
  ├── deduplicateItems()
  ├── Cap at 300
  └── Save artifact: daily-aggregate.json

Phase 2: RE-RANK (enhanced scoring)
  ├── Load daily-aggregate.json
  ├── Fetch previous weekly URLs for dedup
  ├── getScoringPrompt() with enhanced content + new rules
  ├── callLLMJSON() -- may need batching if > 50 items
  ├── Filter >= 70, sort, top 25
  └── Save artifact: scored-items.json

Phase 3: WRITE (style-guided)
  ├── Load scored-items.json
  ├── getWritingPrompt() with VIETNAMESE_STYLE_GUIDE as system
  ├── callLLM() with maxTokens: 8192
  └── Save artifact: weekly-draft.md

Phase 4: REVIEW (3 iterations, structured)
  ├── Load weekly-draft.md
  ├── Loop up to 3 times:
  │   ├── getReviewPrompt() with VIETNAMESE_STYLE_GUIDE
  │   ├── callLLM()
  │   ├── If "PASS" -> break
  │   └── Else: revise draft with critique
  ├── markPhaseComplete('review-pass')
  └── Save artifact: weekly-draft.md (revised)

Phase 5: PUBLISH (proper Lexical)
  ├── Load weekly-draft.md
  ├── parseDraftSections()
  ├── textToLexical() -- now produces proper Lexical nodes
  ├── getExcerptPrompt() -> callLLM()
  ├── Upsert to Payload CMS (weekly collection)
  ├── markDailyTrendingAsMerged()
  └── Save artifact: published.json
```

#### Scoring batching

If aggregated items > 50, batch scoring into groups of 25 (to stay within LLM context limits). Process batches sequentially with 2s delay.

```typescript
const SCORING_BATCH_SIZE = 25

if (scorableItems.length > SCORING_BATCH_SIZE) {
  // Batch scoring
  for (let i = 0; i < scorableItems.length; i += SCORING_BATCH_SIZE) {
    const batch = scorableItems.slice(i, i + SCORING_BATCH_SIZE)
    const prompt = getScoringPrompt(batch, previousUrls)
    const batchScored = await callLLMJSON<ScoredItemFromLLM[]>(prompt, { maxTokens: 4096 })
    allScored.push(...batchScored)
    if (i + SCORING_BATCH_SIZE < scorableItems.length) await sleep(2000)
  }
}
```

---

### Phase 7: Cost Tracking Integration
**Files**: Modify `apps/web/src/lib/trending/llm.ts`
**Effort**: 1h | **Dependency**: None

Wire `trackCost()` into `callLLM()` so every LLM call is automatically logged:

```typescript
// In callLLM(), after successful response:
if (data.usage) {
  trackCost({
    pipeline: 'weekly', // or infer from call stack
    phase: 'unknown',   // caller can pass via options
    model,
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
  })
}
```

Add `phase` to `LLMOptions` interface so callers can tag their calls.

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/weekly/sources.ts` | CREATE | Curated source registry (20+ sources, 3 tiers) |
| `apps/web/src/lib/weekly/scraper.ts` | CREATE | Web scraper: fetch + extract article text |
| `apps/web/src/lib/weekly/style-guide.ts` | CREATE | Vietnamese writing style guide (de-AI rules, link rules, tone) |
| `apps/web/src/lib/weekly/shared.ts` | REWRITE | Fix textToLexical to produce proper heading/link/list/bold nodes |
| `apps/web/src/lib/weekly/prompts.ts` | MODIFY | Inject style guide, enhance scoring prompt, structured review |
| `apps/web/src/lib/weekly/pipeline.ts` | MODIFY | Add scraping step, batch scoring, 3 review iterations, constants |
| `apps/web/src/lib/trending/llm.ts` | MODIFY | Integrate cost tracking, add `phase` to LLMOptions |
| `apps/web/src/lib/weekly/__tests__/shared.test.ts` | CREATE | Tests for textToLexical converter |

## Implementation Order

```
Session 1 (parallel):
  ├── Phase 0: Source list (2h)
  ├── Phase 3: Style guide (3h) -- no dependencies
  └── Phase 4: textToLexical rewrite (4h) -- no dependencies

Session 2:
  └── Phase 1: Scraper module (4h) -- depends on Phase 0

Session 3:
  ├── Phase 2: Scoring improvements (2h) -- depends on Phase 1
  └── Phase 5: Review loop (1.5h) -- depends on Phase 3

Session 4:
  ├── Phase 6: Pipeline wiring (3h) -- depends on all above
  └── Phase 7: Cost tracking (1h) -- independent
```

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Web scraping blocked by sites (CORS, bot detection) | HIGH | Medium | Graceful fallback: if scrape fails, use RSS title+description. Set realistic User-Agent. Accept some sources will fail |
| LLM context window overflow with 300 items | MEDIUM | High | Batch scoring (25 items per call). Truncate article content to 800 chars for scoring, 2000 chars for writing |
| textToLexical edge cases | MEDIUM | Medium | Tests cover common cases. Accept imperfect parsing for v1 -- manual review in Payload Admin catches issues |
| GitHub Actions 15min timeout exceeded | LOW | High | Scraping has per-source timeout (15s). Total source count is 20, not 30+. Phase checkpoints allow re-run |
| Style guide makes LLM prompts too long | LOW | Low | Style guide is ~800 tokens. Total prompt with items still fits in 16K context |

## What This Plan Does NOT Include

1. **Firecrawl MCP integration**: Using native fetch instead. Firecrawl is overkill for 20 sources and adds external dependency + cost.
2. **Vietnamese-specific dev sources** (viblo.asia, topdev.vn): Deferred to v2 once base scraping works.
3. **Podcast generation**: Separate feature (already in `phase-1-podcast` plan).
4. **Multi-model routing**: Using single model (gpt-5.3-codex via VPS proxy) for all phases. Multi-model adds complexity without clear benefit at this scale.
5. **Cloudflare Containers migration**: Keeping GitHub Actions. Container architecture is for always-on agent pattern, which is overengineered for a weekly cron job.

## Unresolved Questions

1. Should the scraper respect `robots.txt`? Current HN/GitHub scrapers do not check it. Pragmatic answer: no, but use polite rate limiting.
2. Should scraped articles be stored in a new Payload collection (like `ScrapedArticles`) for audit/debugging, or only in pipeline artifacts? Recommendation: artifacts only (YAGNI).
3. ArXiv scraping: their RSS feed already provides abstracts. Is deep scraping (fetching full paper pages) worth the effort? Recommendation: no, abstracts are sufficient for weekly digest summaries.
4. What model temperature should be used for writing vs review? Current: default (likely 1.0). Recommendation: 0.7 for writing (some creativity), 0.1 for review (deterministic).
