import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are a Vietnamese tech journalist for a daily podcast called "Tech Digest".
Your job is to summarize English tech articles for Vietnamese listeners.

CRITICAL RULES:
1. Write in natural, conversational Vietnamese suitable for audio
2. Keep technical terms in English (React, LLM, API, Kubernetes, etc.)
3. Each summary should be 150-200 words
4. Structure: Hook sentence → 3 key points → Closing thought
5. No flowery language - focus on engineering value
6. Avoid abbreviations that sound awkward when spoken
7. Use transitional phrases suitable for listening

OUTPUT FORMAT:
Write the summary directly. No headers, no bullet points (they don't work in audio).`

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

/**
 * Execute function with retry logic and exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY_MS
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = i === retries - 1
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('rate limit') ||
          error.message.includes('timeout') ||
          error.message.includes('503') ||
          error.message.includes('429'))

      if (isLastAttempt || !isRetryable) {
        throw error
      }

      const backoff = delay * Math.pow(2, i)
      console.log(`[Summarizer] Retry ${i + 1}/${retries} after ${backoff}ms`)
      await new Promise((resolve) => setTimeout(resolve, backoff))
    }
  }
  throw new Error('Retry exhausted')
}

/**
 * Summarize an article from English to Vietnamese
 * @param title Article title
 * @param url Article URL
 * @param comments Top HN comments for context
 * @returns Vietnamese summary suitable for TTS
 */
export async function summarizeArticle(
  title: string,
  url: string,
  comments: string[]
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const openai = new OpenAI({ apiKey })

  const userContent = `Article Title: ${title}
URL: ${url}

Top Comments from Hacker News:
${comments.length > 0 ? comments.join('\n\n---\n\n') : '(No comments available)'}

Please summarize this article for our Vietnamese podcast audience.`

  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    })
  )

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI returned empty response')
  }

  return content.trim()
}

/**
 * Generate episode title in Vietnamese
 */
export async function generateEpisodeTitle(
  articleTitles: string[],
  date: Date
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // Fallback to default title
    return `Tech Digest - ${date.toLocaleDateString('vi-VN')}`
  }

  const openai = new OpenAI({ apiKey })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 100,
    messages: [
      {
        role: 'system',
        content:
          'Generate a short, catchy Vietnamese podcast episode title (max 10 words) based on the main topics. Keep technical terms in English.',
      },
      {
        role: 'user',
        content: `Topics: ${articleTitles.join(', ')}`,
      },
    ],
  })

  return response.choices[0]?.message?.content?.trim() || `Tech Digest - ${date.toLocaleDateString('vi-VN')}`
}
