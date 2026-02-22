const LLM_TIMEOUT_MS = 60_000
const MAX_RETRIES = 3
const BASE_DELAY_MS = 4_000

interface LLMOptions {
  maxTokens?: number
  temperature?: number
  system?: string
}

interface LLMContentBlock {
  type: string
  text?: string
  thinking?: string
}

interface LLMMessageResponse {
  content: LLMContentBlock[]
  usage?: { input_tokens: number; output_tokens: number }
}

function parseRetryDelay(responseText: string): number | null {
  try {
    const parsed = JSON.parse(responseText)
    const details = parsed?.error?.details
    if (Array.isArray(details)) {
      for (const d of details) {
        if (d.retryDelay) {
          const seconds = parseFloat(d.retryDelay)
          if (!isNaN(seconds)) return Math.ceil(seconds * 1000)
        }
      }
    }
  } catch {
    // not JSON, ignore
  }
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Call the LLM API (Anthropic-compatible endpoint).
 * Retries on 429, 5xx, and empty responses with exponential backoff.
 */
export async function callLLM(
  prompt: string,
  options?: LLMOptions
): Promise<string> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'http://103.90.226.240:8317'
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN || 'sk-dummy'
  const model = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'gpt-5.3-codex'

  const messages: Array<{ role: string; content: string }> = []

  if (options?.system) {
    messages.push({ role: 'user', content: options.system })
    messages.push({
      role: 'assistant',
      content: 'Understood. I will follow these instructions.',
    })
  }

  messages.push({ role: 'user', content: prompt })

  const body = JSON.stringify({
    model,
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature,
    messages,
  })

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': authToken,
          'anthropic-version': '2023-06-01',
        },
        body,
        signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      })

      if (!response.ok) {
        const errorText = await response.text()
        const retryable = response.status === 429 || response.status >= 500
        if (retryable && attempt < MAX_RETRIES) {
          const retryDelay = parseRetryDelay(errorText) ?? BASE_DELAY_MS * 2 ** attempt
          console.log(
            `[LLM] ${response.status} error, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          )
          await sleep(retryDelay)
          continue
        }
        throw new Error(`LLM API error: ${response.status} - ${errorText}`)
      }

      const rawJson = await response.text()
      let data: LLMMessageResponse
      try {
        data = JSON.parse(rawJson)
      } catch {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * 2 ** attempt
          console.log(
            `[LLM] invalid JSON response (${rawJson.slice(0, 200)}), retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          )
          await sleep(delay)
          continue
        }
        throw new Error(`LLM returned invalid JSON: ${rawJson.slice(0, 200)}`)
      }
      const text = data.content?.find((b) => b.type === 'text')?.text

      if (!text) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * 2 ** attempt
          console.log(
            `[LLM] empty response, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          )
          await sleep(delay)
          continue
        }
        throw new Error('LLM returned empty response after retries')
      }

      if (data.usage) {
        console.log(
          `[LLM] model=${model} input=${data.usage.input_tokens} output=${data.usage.output_tokens}`
        )
      }

      return text
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError' && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * 2 ** attempt
        console.log(
          `[LLM] timeout, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        )
        await sleep(delay)
        continue
      }
      throw error
    }
  }

  throw new Error('LLM call exhausted all retries')
}

/**
 * Extract JSON from a string that may be wrapped in markdown code blocks.
 */
function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenced) {
    return fenced[1].trim()
  }
  return text.trim()
}

/**
 * Call the LLM and parse the response as JSON.
 * Retries once with an explicit JSON-only instruction on parse failure.
 */
export async function callLLMJSON<T>(
  prompt: string,
  options?: LLMOptions
): Promise<T> {
  const raw = await callLLM(prompt, options)

  try {
    return JSON.parse(extractJSON(raw)) as T
  } catch {
    // Retry with explicit JSON instruction
    console.log('[LLM] JSON parse failed, retrying with explicit instruction')
    const retryRaw = await callLLM(
      `Respond ONLY with valid JSON, no markdown:\n\n${prompt}`,
      options
    )

    try {
      return JSON.parse(extractJSON(retryRaw)) as T
    } catch {
      throw new Error(
        `LLM JSON parse failed after retry. Raw response: ${retryRaw.slice(0, 200)}`
      )
    }
  }
}
