# Research Report: aigc-weekly Architecture (Deep Dive)

Date: 2026-02-16 | Source: GitHub API exploration of miantiao-me/aigc-weekly

## 1. Infrastructure

### Cloudflare Worker (`worker/`)
- `index.ts`: Entry point. Basic Auth guard → forwards requests to container. Exports `scheduled` handler for cron.
- `container.ts`: Cloudflare Container (Durable Object). Runs OpenCode agent. Auto-sleeps after 10min inactivity. SSE monitoring keeps alive during work.
- `wrangler.jsonc`: Cron trigger `0 23 * * 7` (Sunday 23:00 UTC). Single container instance (`standard-1`).

### Trigger Flow
```
Cloudflare Cron (Sunday 23:00 UTC)
  → Worker.scheduled()
  → triggerWeeklyTask()
  → getContainer(AGENT_CONTAINER)
  → POST /session (create new session)
  → POST /session/{id}/command { command: "weekly" }
```

## 2. Agent Architecture (OpenCode)

### Config (`agent/opencode.json`)
- **Primary agent**: "Agili" (`build` mode) — orchestrator
- **Sub-agents**: `researcher`, `editor`, `writer`, `reviewer`
- **Skills**: `batch-research`, `chinese-writing`, `publish-weekly`
- **Command**: `/weekly` (the entire pipeline)
- **MCP**: Firecrawl (`https://mcp.firecrawl.dev/{API_KEY}/v2/mcp`)
- **Models**: GPT-5.2, Gemini 2.5/3 Flash/Pro, Claude Sonnet 4.5
- **Permissions**: All allowed except `lsp` and `question` (no human interaction)

## 3. The `/weekly` Command — 5-Phase Pipeline

### Phase 1: Batch Research (Content Collection)
**Skill**: `batch-research` | **Agent**: `researcher` (parallel)

1. Reads data sources from `REFERENCE.md` (30+ URLs across 3 tiers)
2. Generates dynamic URLs for Hacker News (one per day in the week range)
3. Dispatches `researcher` sub-agents in parallel batches:
   - Max 5 concurrent, 3s between batches, 2 req/domain rate limit
   - Batch 1: Important Resources (HN, Solidot, daily.dev, etc.)
   - Batch 2: Blogs & Websites (Anthropic, OpenAI, DeepMind, etc.)
   - Batch 3: KOL & Influencers (baoyu.io, Ben's Bites, etc.)
4. Each researcher uses **Firecrawl MCP** to scrape URLs
5. Identifies page type (list → deep crawl links, detail → extract directly)
6. Deep crawl limits: 10 links/layer, 30 total requests, max depth 2
7. Filters: AIGC relevance + date range (start_date to end_date)
8. Output: `drafts/*.md` files with frontmatter (title, source_url, date, source_name)

### Phase 2: Content Curation (Editor Agent)
**Agent**: `editor`

1. Fetches historical articles from `aigc-weekly.agi.li/rss.xml` for dedup
2. Dedup rules: same title/URL, same project repeated, same topic
3. **Scoring matrix** (must score ≥70/100):
   - Relevance (40%): Core AIGC=40, tangential=20, unrelated=0
   - Impact (30%): Major release=30, routine update=15, fluff=0
   - Utility (30%): Code/demo/tutorial=30, paper-only=15, news-only=0
4. GitHub repos below 100 stars → auto-discard. Star surge → auto-pass.
5. Categorizes: `news`, `model`, `tool`
6. Output: `drafts.yaml` (structured, scored, categorized with reasons)

### Phase 3: Writing (Writer Agent)
**Agent**: `writer` | **Skill**: `chinese-writing`

1. Reads `drafts.yaml` + original `drafts/*.md` for full context
2. Structure: 开场白 → 资讯 → 模型 → 工具 → 结束语
3. Each item: 2-5 sentence summary, source links as anchor text
4. Style: professional, objective, slightly playful, moderate emoji
5. Output: Final Markdown file (e.g., `aigc-weekly-y26-w12.md`)

### Phase 4: Review Loop (Reviewer Agent)
**Agent**: `reviewer` | **Skill**: `chinese-writing`

1. Reviews against writing standards
2. Checks: AIGC relevance, no marketing content, date range, links preserved
3. Returns "PASS" or specific critique with paragraph-level suggestions
4. If critique → Writer revises → Reviewer re-reviews (max 3 iterations)
5. Output: Approved Markdown file

### Phase 5: Publish to CMS (publish-weekly Skill)
**Skill**: `publish-weekly`

1. Uses Payload REST API with `Authorization: users API-Key {PAYLOAD_API_KEY}`
2. Idempotent: GET by `issueNumber` → PATCH if exists, POST if not
3. Field mapping: title, summary (auto-generated if not provided), content (full MD), issueNumber, status=draft, publishDate
4. Saves CMS response to `published/{week_id}.json`
5. Always publishes as **draft** (human reviews in Payload Admin before publishing)

## 4. Recovery & Resumability

Each phase has an artifact-based checkpoint:

| Phase | Completion Signal | Resume Action |
|-------|-------------------|---------------|
| 1 | `drafts/*.md` exist | Skip to Phase 2 |
| 2 | `drafts.yaml` exists | Skip to Phase 3 |
| 3 | `{filename}` exists | Skip to Phase 4 |
| 5 | `published/{week_id}.json` exists | Done |

Logs (`logs/weekly-{week_id}.log`) are for human audit only, not recovery.

## 5. Data Sources (`REFERENCE.md`)

### Tier 1: Important Resources (11 sources)
- Hacker News (front + Show HN), drafts.miantiao.me, Solidot AI, poche.app
- daily.dev (AI, Prompt Engineering, Vibecoding squads)
- engineering.fyi/generative-ai, every.to, HackerNoon AI

### Tier 2: Blogs & Websites (11 sources)
- Anthropic Engineering, Claude Blog, OpenAI Dev Blog, DeepMind Blog
- GitHub AI/ML, Continue, Kilo, Cline, Ampcode, Cognition, Manus

### Tier 3: KOL & Influencers (6 sources)
- baoyu.io, Ben's Bites, Lenny's Newsletter (AI Podcast)
- Latent Space, One Useful Thing, Interconnects

## 6. Data Model

### Weekly Collection (Payload CMS)
```typescript
fields: title, summary, content (textarea with OvertypeFieldComponent),
        issueNumber (unique, format: Y26W12), status (draft/published),
        publishDate, coverImage (→media), links [{label, url}], tags [{value}]
```

Key insight: `content` is a **plain textarea** (not Lexical richtext), storing raw Markdown. A custom `OvertypeFieldComponent` provides the editing UX. No separate Article collection — the entire newsletter is one Markdown blob.

## 7. Key Architectural Patterns to Learn

1. **Agent-as-orchestrator**: Primary agent delegates to specialized sub-agents. No code scripts — the "pipeline" is an LLM prompt chain.
2. **Firecrawl MCP**: Content extraction via MCP protocol, not custom scrapers. Agent calls Firecrawl tools naturally.
3. **Artifact-based recovery**: Each phase produces a file. Presence of file = phase complete. Simple, no state DB needed.
4. **Scoring matrix**: Quantitative content curation (≥70/100 threshold). Prevents low-quality content.
5. **Review loop**: Writer → Reviewer → Writer cycle (max 3) ensures quality.
6. **Draft-first**: Always saves as draft. Human makes final publish decision.
7. **Parallel batch processing**: 5 concurrent researchers, 3 priority tiers, rate limiting per domain.
8. **Historical dedup**: Checks RSS feed of published issues to avoid repeating topics.

## Unresolved Questions

1. How is `OvertypeFieldComponent` implemented? (Custom Payload field component for Markdown editing)
2. What happens when Firecrawl fails on a source? (researcher retries 3x with exponential backoff)
3. How does the agent handle context window limits when processing 30+ sources?
4. Is there a cost tracking mechanism for the multi-model agent usage?
