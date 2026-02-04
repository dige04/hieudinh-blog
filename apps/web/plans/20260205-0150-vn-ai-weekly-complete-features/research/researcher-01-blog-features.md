# Vietnamese AI Weekly - Modern Blog Features Report
Date: 2026-02-05

## 1. Newsletter Subscription Flows
**State of 2026**: High-friction signups (e.g., extensive forms) are dead. "Inline value exchange" is king.

*   **Provider**: **Resend** (Standard for Next.js).
    *   *Why*: Developer-first API, React Email templates, high deliverability.
    *   *Alternative*: ConvertKit (if heavy automation needed).
*   **Flow**:
    *   **Input**: Email-only field.
    *   **Double Opt-in (Mandatory)**: Prevent spam traps. Send a "Confirm your subscription" email immediately.
    *   **UI Patterns**:
        *   **Sticky Footer/Header**: Non-intrusive, persistent on mobile.
        *   **Inline Content Blocks**: "Enjoying this? Get weekly updates" after 30% scroll depth.
        *   **Exit Intent Modal**: Only on desktop, trigger when cursor leaves viewport.

## 2. SEO Best Practices (Next.js 14/15)
**State of 2026**: Metadata API is the single source of truth. Structured data is for AI agents.

*   **Metadata API**:
    *   Use `generateMetadata()` for dynamic titles/descriptions.
    *   `metadataBase`: Set to production URL to fix OG image paths.
*   **OpenGraph (OG)**:
    *   **Dynamic Generation**: `opengraph-image.tsx` using `next/og` (Edge Runtime).
    *   **Content**: Post title + Author + "VN AI Weekly" brand.
*   **Structured Data (JSON-LD)**:
    *   **Schema**: `BlogPosting` (Article), `BreadcrumbList`.
    *   **Implementation**: Inject via `<script type="application/ld+json">` in Server Components.
    *   **AI Readiness**: Explicitly tag content with `mentions` (entities) for improved AI search indexing (Perplexity/SGE).

## 3. Social Sharing
**State of 2026**: Native & Contextual.

*   **Mobile**: Use **Web Share API** (`navigator.share()`).
    *   *Benefit*: Uses native OS sheet (AirDrop, Messages, etc.). Higher trust.
*   **Desktop**:
    *   **Highlight-to-Share**: Medium-style tooltip when text is selected.
    *   **Sticky Sidebar**: Left-aligned vertical bar (Twitter/X, LinkedIn, Copy Link).
*   **Copy Link**: The most used "share" action. Make it one-click with a toast confirmation ("Link copied!").

## 4. Reading Progress
**State of 2026**: Subtle & Performance-first.

*   **Implementation**: `CSS Scroll-driven Animations` (native browser support) > JS Listeners.
    *   *Why*: Zero main-thread impact.
    *   *Fallback*: `framer-motion` `useScroll` hook.
*   **Design**:
    *   Top aligned, 2-3px height.
    *   **Scoped**: Track *article content* only, not the entire page (stop before comments/footer).

## 5. Related Posts (Discovery)
**State of 2026**: Semantic & Continuous.

*   **Logic**:
    *   **Vector Search**: OpenAI embeddings stored in Supabase/Pinecone (better than tag matching).
    *   **Recency**: Weight newer posts higher for "Weekly" news relevance.
*   **UI Pattern**:
    *   **"Up Next"**: Single card at bottom (Netflix style) for mobile.
    *   **Grid**: 3-card grid for desktop.
    *   **Context**: "Because you read [Topic X]" label.

## Unresolved Questions
1. Do we need a dedicated "Archive" page for past newsletters vs. standard blog pagination?
2. Should we implement a "Save for Later" feature (local storage bookmarking)?

## Citations
*   Next.js Metadata API Docs (2025)
*   Smashing Magazine: "Progress Indicators: Make the Wait Bearable"
*   Google Search Central: "Article Structured Data"
