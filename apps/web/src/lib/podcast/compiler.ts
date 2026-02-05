export interface ArticleSummary {
  title: string
  summary: string
  hnId: string
  url: string
}

/**
 * Compile article summaries into a complete podcast script
 * @param summaries Array of article summaries
 * @param date Episode date
 * @returns Complete script ready for TTS
 */
export function compileScript(summaries: ArticleSummary[], date: Date): string {
  const dateStr = formatVietnameseDate(date)

  const intro = generateIntro(summaries.length, dateStr)
  const body = generateBody(summaries)
  const outro = generateOutro()

  // Add pauses between sections (TTS will interpret periods as pauses)
  return `${intro}\n\n${body}\n\n${outro}`
}

function formatVietnameseDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function generateIntro(articleCount: number, dateStr: string): string {
  return `Xin chào! Đây là Tech Digest, bản tin công nghệ ${dateStr}. Hôm nay chúng ta có ${articleCount} tin đáng chú ý từ Hacker News. Bắt đầu thôi!`
}

function generateBody(summaries: ArticleSummary[]): string {
  return summaries
    .map((s, i) => {
      const articleNumber = i + 1
      const transition = getTransition(i, summaries.length)
      return `${transition}Tin số ${articleNumber}: ${s.title}.\n\n${s.summary}`
    })
    .join('\n\n')
}

function getTransition(index: number, total: number): string {
  if (index === 0) return ''
  if (index === total - 1) return 'Và cuối cùng. '
  const transitions = ['Tiếp theo. ', 'Chuyển sang tin tiếp. ', 'Tin kế tiếp. ']
  return transitions[index % transitions.length]
}

function generateOutro(): string {
  return `Đó là tất cả cho hôm nay. Cảm ơn bạn đã lắng nghe Tech Digest. Nếu thấy hay, hãy chia sẻ với bạn bè nhé. Hẹn gặp lại trong bản tin ngày mai!`
}

/**
 * Estimate audio duration from script
 * Vietnamese speech: ~120-150 words per minute
 * @param script Full script text
 * @returns Estimated duration in seconds
 */
export function estimateScriptDuration(script: string): number {
  const wordCount = script.split(/\s+/).length
  const wordsPerMinute = 130
  return Math.ceil((wordCount / wordsPerMinute) * 60)
}
