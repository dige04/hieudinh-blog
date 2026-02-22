/**
 * Chinese-to-Vietnamese translator using GPT-5.3 Codex.
 * Uses the LLM proxy's OpenAI-compatible chat completions endpoint.
 */

const TRANSLATION_MODEL = 'gpt-5.3-codex'
const TRANSLATION_TIMEOUT_MS = 120_000

export interface TranslationResult {
  translatedContent: string
  translatedTitle: string
}

/** Translate a Chinese blog post to natural Vietnamese. */
export async function translatePost(
  chineseContent: string,
  originalTitle: string
): Promise<TranslationResult> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'http://103.90.226.240:8317'
  const authToken = process.env.PROXY_AUTH_TOKEN || 'sk-dummy'

  const prompt = buildTranslationPrompt(chineseContent, originalTitle)

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      model: TRANSLATION_MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(TRANSLATION_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const translated = data.choices?.[0]?.message?.content
  if (!translated) throw new Error('No translation content in response')

  // Extract title from translated content
  const titleMatch = translated.match(/^#\s+(.+)$/m)
  const translatedTitle = titleMatch?.[1]?.trim() || originalTitle

  return {
    translatedContent: translated,
    translatedTitle,
  }
}

function buildTranslationPrompt(content: string, title: string): string {
  return `B\u1ea1n l\u00e0 m\u1ed9t d\u1ecbch gi\u1ea3 chuy\u00ean nghi\u1ec7p, chuy\u00ean d\u1ecbch n\u1ed9i dung c\u00f4ng ngh\u1ec7 t\u1eeb ti\u1ebfng Trung sang ti\u1ebfng Vi\u1ec7t.

H\u00e3y d\u1ecbch b\u00e0i vi\u1ebft d\u01b0\u1edbi \u0111\u00e2y sang ti\u1ebfng Vi\u1ec7t m\u1ed9t c\u00e1ch t\u1ef1 nhi\u00ean, nh\u01b0 ng\u01b0\u1eddi Vi\u1ec7t vi\u1ebft ch\u1ee9 kh\u00f4ng ph\u1ea3i d\u1ecbch m\u00e1y.

Y\u00caU C\u1ea6U:
1. D\u1ecbch T\u1ef0 NHI\u00caN - vi\u1ebft l\u1ea1i b\u1eb1ng ti\u1ebfng Vi\u1ec7t, kh\u00f4ng d\u1ecbch t\u1eebng t\u1eeb
2. GI\u1eee NGUY\u00caN t\u1ea5t c\u1ea3 links/URLs g\u1ed1c
3. GI\u1eee NGUY\u00caN c\u1ea5u tr\u00fac markdown (##, ###, **, -, etc.)
4. GI\u1eee NGUY\u00caN t\u00ean ri\u00eang (c\u00f4ng ty, s\u1ea3n ph\u1ea9m, ng\u01b0\u1eddi) b\u1eb1ng ti\u1ebfng Anh/g\u1ed1c
5. GI\u1eee NGUY\u00caN format h\u00ecnh \u1ea3nh ![alt](url) - KH\u00d4NG thay \u0111\u1ed5i URL \u1ea3nh
6. Thu\u1eadt ng\u1eef k\u1ef9 thu\u1eadt: d\u00f9ng ti\u1ebfng Anh g\u1ed1c k\u00e8m gi\u1ea3i th\u00edch ti\u1ebfng Vi\u1ec7t n\u1ebfu c\u1ea7n
7. Gi\u1ecdng v\u0103n: th\u00e2n thi\u1ec7n, d\u1ec5 hi\u1ec3u, nh\u01b0 \u0111ang n\u00f3i chuy\u1ec7n v\u1edbi \u0111\u1ed3ng nghi\u1ec7p dev

TI\u00caU \u0110\u1ec0 G\u1ed0C: ${title}

N\u1ed8I DUNG TI\u1ebeNG TRUNG:
${content}

H\u00e3y d\u1ecbch to\u00e0n b\u1ed9 b\u00e0i vi\u1ebft. B\u1eaft \u0111\u1ea7u b\u1eb1ng ti\u00eau \u0111\u1ec1 d\u1ecbch (# Ti\u00eau \u0111\u1ec1 ti\u1ebfng Vi\u1ec7t).`
}
