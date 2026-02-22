/**
 * LLM prompt templates for the weekly digest pipeline.
 *
 * Each function returns a formatted prompt string for a specific phase.
 * Prompts are kept separate from pipeline logic to allow iteration
 * without touching orchestration code.
 */

import { VIETNAMESE_STYLE_GUIDE, REVIEW_CHECKLIST } from './style-guide'

// ---------------------------------------------------------------------------
// Phase 2: Scoring / re-ranking prompt
// ---------------------------------------------------------------------------

interface ScorableItem {
  id: string
  title: string
  url: string
  content?: string
  summary?: string
  score?: { total: number }
}

export function getScoringPrompt(items: ScorableItem[], previousUrls: string[]): string {
  const itemsJson = JSON.stringify(
    items.map((i) => ({
      id: i.id,
      title: i.title,
      url: i.url,
      summary: i.content?.slice(0, 800) || i.summary || '',
    })),
    null,
    2
  )

  const prevUrlList =
    previousUrls.length > 0
      ? previousUrls.join('\n')
      : '(none)'

  return `You are an AI content curator. Score each item using this matrix:

SCORING (total 100):
- Relevance (40%): Core AI/ML topic = 40, tangential tech = 20, unrelated = 0
- Impact (30%): Major release/breakthrough = 30, routine update = 15, fluff/opinion = 0
- Utility (30%): Has code/demo/tutorial = 30, paper with results = 15, news-only = 0

RULES:
- Items scoring < 70 are EXCLUDED
- Items matching these previously covered URLs/titles get 0.3x penalty:
${prevUrlList}
- Categorize each item: tin-tuc | mo-hinh | cong-cu | nghien-cuu | huong-dan
- GitHub repositories with < 100 stars: auto-score 0 unless trending (> 50 stars today)
- Content older than 14 days from today: apply 0.5x penalty

INPUT:
${itemsJson}

OUTPUT FORMAT (JSON array):
[
  {
    "id": "...",
    "title": "...",
    "url": "...",
    "score": 85,
    "relevance": 40,
    "impact": 30,
    "utility": 15,
    "category": "mo-hinh",
    "reason": "Major GPT-5 release with API access"
  }
]

Return ONLY the JSON array. No markdown fences. No explanation.`
}

// ---------------------------------------------------------------------------
// Phase 3: Vietnamese writing prompt
// ---------------------------------------------------------------------------

interface WritableItem {
  title: string
  url: string
  score: number
  category: string
  summary?: string
  reason?: string
  content?: string
}

export function getWritingPrompt(scoredItems: WritableItem[], weekId: string): string {
  const itemsList = scoredItems
    .sort((a, b) => b.score - a.score)
    .map((i) => {
      const snippet = i.content?.slice(0, 300) || i.summary || i.reason || ''
      return `- [${i.score}] ${i.title} (${i.category}) ${i.url}\n  Content: ${snippet}`
    })
    .join('\n')

  return `${VIETNAMESE_STYLE_GUIDE}

---

Ban la Hieu, mot tech blogger Viet Nam chuyen ve AI. Viet ban tin tuan ${weekId}.

ITEMS (ranked by score, each with content snippet for context):
${itemsList}

STRUCTURE:
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
- Follow ALL rules in the Writing Style Guide above
- Moi tin 2-5 cau, PHAI co source link inline [text](url)
- Su dung markdown: ## heading, ### sub-heading, **bold**, [text](url)
- KHONG quang cao, chi phan tich khach quan`
}

// ---------------------------------------------------------------------------
// Phase 4: Review prompt (structured critique)
// ---------------------------------------------------------------------------

export function getReviewPrompt(
  draft: string,
  startDate: string,
  endDate: string
): string {
  const checklist = REVIEW_CHECKLIST.map((c, i) => `${i + 1}. ${c}`).join('\n')

  return `${VIETNAMESE_STYLE_GUIDE}

---

Review this Vietnamese AI weekly digest against the style guide above.

CHECK ALL CRITERIA:
${checklist}
${REVIEW_CHECKLIST.length + 1}. DATE RANGE: Content should cover week ${startDate} to ${endDate}.
${REVIEW_CHECKLIST.length + 2}. AI RELEVANCE: Every item must be about AI/ML. Flag non-AI items.

DRAFT:
${draft}

RESPOND WITH EXACTLY ONE OF:
A) "PASS" (if all criteria met)
B) JSON array of critique items:
[
  {
    "criterion": "de-ai-ification",
    "section": "## Mo hinh & Nghien cuu",
    "issue": "Uses 'buoc dot pha' which is banned phrase",
    "fix": "Replace with specific metric comparison"
  }
]

Return ONLY "PASS" or the JSON array. No explanation.`
}

// ---------------------------------------------------------------------------
// Revision prompt (incorporates structured critique)
// ---------------------------------------------------------------------------

export function getRevisionPrompt(
  scoredItems: WritableItem[],
  weekId: string,
  currentDraft: string,
  critique: string
): string {
  return `${getWritingPrompt(scoredItems, weekId)}

CURRENT DRAFT:
${currentDraft}

REVIEWER FEEDBACK (fix ALL of these issues):
${critique}

Rewrite the draft addressing ALL feedback. Keep the same structure. Return ONLY the revised draft.`
}

// ---------------------------------------------------------------------------
// Excerpt generation prompt
// ---------------------------------------------------------------------------

export function getExcerptPrompt(contentText: string): string {
  return `Tóm tắt trong 2 câu (max 200 ký tự) nội dung chính của bản tin AI tuần này:
${contentText.slice(0, 1000)}

Chỉ trả về câu tóm tắt, không giải thích.`
}
