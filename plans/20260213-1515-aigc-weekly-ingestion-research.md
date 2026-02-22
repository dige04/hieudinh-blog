# AIGC Weekly Ingestion Research (https://aigc-weekly.agi.li/)

## Scope
Research-only. No implementation.

## Executive decision
Preferred ingestion order (stable, practical):
1. **Primary:** `https://aigc-weekly.agi.li/rss.xml`
2. **Secondary fallback:** `https://aigc-weekly.agi.li/sitemap.xml` + fetch each `/weekly/YxxWyy` page
3. **Tertiary fallback:** paginated homepage scraping `/?page=N`

Reason: RSS exists, has standard fields, and directly carries weekly items + content HTML. Sitemap is stable and gives canonical weekly URL inventory.

---

## 1) Feed endpoint discovery and stability

### Confirmed endpoints
- **RSS (valid):** `https://aigc-weekly.agi.li/rss.xml`
  - Exposed in homepage via `rel="alternate" type="application/rss+xml"`
  - Feed includes channel metadata + item fields: `title`, `description`, `link`, `guid`, `dc:creator`, `pubDate`, `content:encoded`
- **Sitemap (valid):** `https://aigc-weekly.agi.li/sitemap.xml`
  - Contains homepage + `/weekly/YxxWyy` entries
  - URL pattern observed: `/weekly/Y25W44` ... `/weekly/Y26W05`

### Not found (404)
- `https://aigc-weekly.agi.li/feed.xml`
- `https://aigc-weekly.agi.li/atom.xml`
- `https://aigc-weekly.agi.li/index.xml`
- `https://aigc-weekly.agi.li/feed`
- `https://aigc-weekly.agi.li/feed.json`
- `https://aigc-weekly.agi.li/.well-known/feed.json`

### Stability recommendation
- Treat **`/rss.xml` as canonical ingestion endpoint**.
- Use **`/sitemap.xml` as reconciliation source** (gap check, backfill, feed outage fallback).
- Do not rely on Atom/JSON feed: currently absent.

---

## 2) Page structure to parse when feed is unavailable

### Listing pages
- Pagination works: `/?page=1`, `/?page=2`, `/?page=3`
- Weekly card URL pattern: `/weekly/Y{2-digit-year}W{2-digit-week}`

### Reliable selectors (list page)
- List container: `div.posts`
- Card root: `article.post.on-list`
- Title/link: `h2.post-title a[href]`
- Date: `time.post-date[dateTime]`
- Tags: `span.post-tags > span.post-tag`
- Summary: `div.post-content p`
- Read-more link: `a.read-more.button.inline`
- Pager container: `div.pagination`, `div.pagination__buttons`

### Reliable selectors (detail page `/weekly/...`)
- Root: `article.post`
- Main title: `h1.post-title a`
- Publish time: `time.post-date[datetime]`
- Meta area: `.post-meta` (includes author/issue info)
- Tag area: `span.post-tags span.post-tag`
- Content block: `.post-content`
- External referenced links: `.post-content a[href^="http"]`

### Metadata signals (detail page)
- Standard meta: `title`, `description`, `author`, `keywords`
- OG/Twitter meta present
- RSS alternate link present
- JSON-LD not observed in sampled output

---

## 3) Reliable parsing strategy + failure handling (weekly automation)

## Parsing strategy (KISS)
1. Fetch RSS (`/rss.xml`).
2. Parse items, normalize fields, upsert by deterministic key.
3. Validate weekly completeness against sitemap.
4. For missing/inconsistent item, fetch `/weekly/YxxWyy` page and parse detail selectors.

## Identity and idempotency
- Preferred unique key priority:
  1. `guid` (if stable)
  2. `link` (canonical weekly URL)
  3. Derived issue code from URL (`Y26W05`)
- Upsert, never blind insert.

## Date normalization
- Prefer `pubDate` from RSS.
- Fallback to page `time[datetime]`.
- Store UTC ISO8601 + source timezone note if needed.

## Content quality checks
- Reject/flag item if missing `title` or canonical `url`.
- Compare `summary` length thresholds (too short/empty => fetch detail page).
- If `content:encoded` missing/truncated, parse detail page body.

## Failure handling (practical)
- HTTP/network: retry with exponential backoff (e.g., 3 attempts).
- Parser failure: fallback parser path (RSS -> sitemap+HTML parse).
- Partial ingestion: commit successful items; queue failed URLs for retry.
- Drift detection: alert if selector misses exceed threshold or weekly URL pattern changes.
- Duplicate prevention: enforce unique constraint on canonical URL or issue code.

## Operational guardrails
- Weekly schedule + manual re-run capability.
- Keep last successful run watermark (`last_seen_pub_date` + `last_seen_issue_code`).
- Reconciliation job (daily/light): compare stored issues vs sitemap weekly URLs.

---

## 4) Concrete extraction fields to store

Minimum durable schema:
- `source` (constant: `aigc-weekly`)
- `issue_code` (e.g., `Y26W05`)
- `title`
- `url` (canonical weekly URL)
- `guid` (nullable)
- `published_at` (UTC ISO8601)
- `author` (e.g., `Agili`, if available)
- `summary` (RSS `description` or list-page summary)
- `content_html` (RSS `content:encoded` or detail-page `.post-content`)
- `tags` (array)
- `outbound_links` (array of `{url, anchor_text?}` from detail content)
- `lang` (e.g., `zh-CN` when inferable)
- `ingested_at`
- `updated_at`
- `hash` (content fingerprint for change detection)
- `raw_payload` (optional JSON blob for debugging/auditing)

Recommended quality/status fields:
- `ingestion_method` (`rss` | `sitemap_html` | `listing_html`)
- `parse_status` (`ok` | `partial` | `failed`)
- `parse_warnings` (array)
- `retry_count`

---

## Evidence snapshot (what was validated)
- RSS exists and is linked as alternate feed on homepage.
- Sitemap exists and enumerates weekly URLs with clear `/weekly/YxxWyy` pattern.
- Pagination exists and stable on `/?page=N`.
- Detail pages have consistent structural markers for resilient fallback parse.
- Atom and JSON feed endpoints tested were not available (404).

---

## Recommended endpoint policy
- **Canonical ingest endpoint:** `https://aigc-weekly.agi.li/rss.xml`
- **Canonical discover/reconcile endpoint:** `https://aigc-weekly.agi.li/sitemap.xml`
- **Fallback extraction path:** `https://aigc-weekly.agi.li/weekly/<issue_code>`

---

## Unresolved questions
1. Is RSS item `guid` guaranteed immutable long-term or could it change format?
2. Does the publisher ever update past issues (retroactive edits), and if yes, what SLA matters for re-crawl?
3. Are there anti-bot/rate limits not visible in current responses that require stricter pacing?
