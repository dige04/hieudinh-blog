# Research: Content Pipeline & API Integration

## 1. Hacker News API Analysis
**Base URL:** `https://hacker-news.firebaseio.com/v0`
**Auth/Rate Limits:** No authentication required. No formal rate limits (Firebase based), but aggressive polling is discouraged.

### Core Endpoints
- **Top Stories:** `/topstories.json` → Returns `[id1, id2, ...]` (Top 500)
- **New Stories:** `/newstories.json` → Returns `[id1, id2, ...]`
- **Item Details:** `/item/{id}.json` → Returns Item Object
- **User Details:** `/user/{id}.json` → Returns User Object

### Data Structure (Item Object)
```json
{
  "id": 8863,
  "type": "story", // or "comment", "job", "poll"
  "by": "dhouston",
  "time": 1175714200,
  "title": "My YC app: Dropbox - Throw away your USB drive",
  "url": "http://www.getdropbox.com/u/2/screencast.html",
  "score": 111,
  "descendants": 71, // comment count
  "kids": [8952, 9224, 8917] // top-level comment IDs
}
```
**Constraint:** Getting a list of stories requires 1 call for the list + N calls for details. **Action:** Use HTTP/2 multiplexing or batch parallel requests (limit concurrency to ~20-50).

## 2. OpenAI Translation & Summarization (En → Vi)
**Model:** `gpt-4o` (optimal balance of cost/performance for Vietnamese).
**Temperature:** `0.3` (precise, less creative).

### Prompt Engineering Pattern
**System Prompt:**
```text
You are a senior technical editor for a Vietnamese tech newsletter.
Your goal is to summarize English technical articles into concise Vietnamese.
CRITICAL RULES:
1. Keep technical terms in English (e.g., "React", "Serverless", "Latency", "LLM").
2. Tone: Professional, direct, informative (Báo chí/Kỹ thuật).
3. Structure:
   - Title (Vietnamese)
   - One-sentence summary (The "Hook")
   - 3 bullet points of key technical details.
4. Do not use flowery language. Focus on engineering value.
```

**User Prompt:**
```text
Title: {title}
URL: {url}
Content/Comments: {content_snippet}

Translate and summarize.
```

## 3. Pipeline Architecture Patterns
**Pattern:** "Fan-Out Fetch → Filter → Enrich → Synthesize"

### 1. Ingestion (Cron/Trigger)
- **Fetch:** Get `/topstories.json` (first 30-50 items).
- **Filter:** Ignore items with `score < 100` or `descendants < 20` (low signal).
- **Dedupe:** Check DB for `id`.

### 2. Processing (Queue Worker)
- **Enrich:** Fetch `url` content (using a scraper/reader) + Fetch top 3-5 `kids` (comments) for context.
- **Synthesize:** Send Title + Content + Top Comments to OpenAI.
  - *Why Comments?* HN comments often contain better insight than the article itself.

### 3. Storage & Publishing
- **Schema:**
  - `hn_id` (Primary Key)
  - `original_title`
  - `translated_title`
  - `summary_markdown`
  - `tags` (extracted by AI)
  - `published_at`
- **Output:** Generate static JSON/Markdown for frontend/podcast engine.

### Unresolved Questions
- **Scraping:** Will we scrape the target URLs for full context? (Recommended: Yes, but handle anti-bot).
- **Audio:** Is the output purely text for now, or immediate TTS? (Assumption: Text first).
