# Research Report: X (Twitter) AI Trending Content Collection

## Executive Summary
As of February 2026, collecting trending AI content from X (Twitter) faces significant financial and technical barriers due to the new **Pay-Per-Usage (PPU)** API model and aggressive anti-scraping measures. The free tier is effectively dead for commercial use. A reliable daily bot requires a hybrid approach: using the official API for targeted, high-value data retrieval (spending credits wisely) while leveraging third-party aggregators (Trends24) and carefully managed alternative scrapers for broader trend signal detection. Direct scraping carries high legal risk with liquidated damages of $15k per 1M posts.

## Research Methodology
- **Sources consulted**: 6 (Official X Docs, GitHub Repos, Tech Blogs)
- **Date range**: Feb 2025 - Feb 2026
- **Key search terms**: X API v2 pricing 2026, pay-per-usage, Nitter status, AI content detection, Terms of Service scraping.

## Key Findings

### 1. X API v2: The Pay-Per-Usage Reality (2026)
X has transitioned from fixed tiers to a credit-based PPU model.
- **Cost**: ~$0.005 per "Post Read" (approx. $5.00 per 1,000 posts).
- **Search Rate Limits**:
    - **User Auth**: 180 requests / 15 min.
    - **App Auth**: 450 requests / 15 min.
    - **Note**: Limits are now "soft" caps; running out of pre-paid credits stops access immediately.
- **Legacy Tiers**: Basic ($200/mo) and Pro ($5,000/mo) are grandfathered but closed to new users.
- **Cost Implication**: A bot reading 1,000 tweets daily costs ~$150/month. Reading 10,000 tweets daily costs ~$1,500/month.

### 2. Alternative Data Sources & Status
- **Nitter**: **Dead** for reliable automated scraping. Most instances are rate-limited or require "guest accounts" which are unstable.
- **Trends24.in**: **Alive**. Provides hourly/daily trending hashtags by location. Good for *identifying* what to search for, reducing API waste.
- **SocialBlade / Third-party**: Useful for *user* stats, less for *content* discovery.
- **Scrapers (Selenium/Playwright)**: Exist (e.g., `Eunit99/x-twitter-trends-scraper-repo`), but high maintenance due to UI changes and CAPTCHAs.

### 3. Trending Signal Detection
Since "firehose" access is cost-prohibitive, use **Smart Sampling**:
1.  **Seed List**: Monitor ~50 top AI influencers/engineers (high signal-to-noise).
2.  **Keyword/Hashtag Targeting**: Use Trends24 to find rising tags (e.g., "#GPT5", "#DevinAI"), then use X API to fetch top 50 tweets for those specific tags.
3.  **Engagement Velocity**: Track likes/retweets count over 1-hour windows to rank "trending" status within your fetched batch.

### 4. Daily Batch Collection Architecture
- **Frequency**: Run every 4-6 hours (not hourly) to save credits.
- **Deduplication**: Store `tweet_id` in a lightweight DB (SQLite/Redis) to prevent re-processing.
- **Storage**: JSON format with metadata (`text`, `author_id`, `created_at`, `metrics`).
- **Pipeline**:
    1.  Fetch "Global AI Trends" keywords (Source: Trends24/Google Trends).
    2.  Query X API `GET /2/tweets/search/recent` with high-precision query (e.g., `(AI OR LLM) min_faves:100 -is:retweet`).
    3.  Filter results (keyword matching, exclude crypto/spam).
    4.  Save to "Daily Batch".

### 5. Legal & ToS Risks (Critical)
- **Jan 2026 ToS Update**: Explicitly prohibits scraping for AI training.
- **Penalties**: **$15,000 liquidated damages** per 1 million posts scraped without consent.
- **Compliance**: The **only** safe path for a commercial bot is the official API. "Research" exemptions are non-existent for unauthorized scraping.

## Implementation Recommendations

### Recommended "Lean" Pipeline (Cost < $50/mo)
1.  **Trigger**: Daily cron job (e.g., 6 PM UTC).
2.  **Discovery**: Scrape `trends24.in` (HTML parsing) for top 3 "Tech" hashtags.
3.  **Validation**: Use X API `search/recent` to pull 100 top tweets for those hashtags + specific queries like `(#AI OR #MachineLearning) lang:en -is:retweet is:verified`.
4.  **Ranking**: Sort by `(retweets * 2) + likes`.
5.  **Output**: Generate Markdown summary.

### Common Pitfalls
- **Over-fetching**: querying generic terms like "AI" will burn credits on spam. Use `min_faves` filter.
- **Ignoring Rate Limits**: PPU means "rate limit" = "wallet limit". Monitor usage closely.
- **Dependency on Nitter**: Do not build core infra on Nitter; it will break.

## Unresolved Questions
- Does the "Public Utility" free tier application process apply to open-source news bots? (Unlikely, but worth investigating).
- Exact pricing for the `get/trends` endpoint specifically (often bundled differently than tweet reads).
- Can we legally cache tweet *IDs* and embed them using `react-tweet` without storing full text to minimize ToS risk?
