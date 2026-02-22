/**
 * Shared utilities for the weekly digest pipeline.
 *
 * Re-exports LLM helpers from the trending module and provides
 * textToLexical conversion and week/issue number formatting.
 */

import ObjectID from 'bson-objectid'

export { callLLM as callAI, callLLMJSON } from '../trending/llm'

// ---------------------------------------------------------------------------
// Lexical JSON types
// ---------------------------------------------------------------------------

export interface LexicalRoot {
  root: {
    type: 'root'
    version: 1
    children: LexicalNode[]
    direction: 'ltr'
    format: ''
    indent: 0
  }
  [key: string]: unknown
}

export interface LexicalNode {
  type: string
  version: number
  children?: LexicalNode[]
  text?: string
  format?: number | string
  tag?: string
  listType?: string
  url?: string
  direction?: string
  indent?: number
  value?: number | { id: string }
  start?: number
  textFormat?: number
  textStyle?: string
  detail?: number
  mode?: string
  style?: string
  rel?: string
  target?: string | null
  title?: string | null
  id?: string
  fields?: {
    linkType: 'custom' | 'internal'
    newTab?: boolean
    url?: string
    doc?: unknown
  } | null
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Inline markdown parser
// ---------------------------------------------------------------------------

// Matches **bold**, [text](url), *italic* — in priority order
const INLINE_RE = /(\*\*(?:[^*]|\*(?!\*))+\*\*|\[(?:[^\]])+\]\([^)]+\)|\*(?:[^*])+\*)/

function makeTextNode(text: string, format: number = 0): LexicalNode {
  return {
    type: 'text',
    version: 1,
    text,
    format,
    detail: 0,
    mode: 'normal',
    style: '',
  }
}

function makeLinkNode(text: string, url: string): LexicalNode {
  return {
    type: 'link',
    version: 3,
    id: new (ObjectID as unknown as typeof ObjectID.default)().toHexString(),
    fields: {
      linkType: 'custom',
      newTab: false,
      url,
    },
    children: [makeTextNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
  }
}

/** Parse inline markdown formatting within a single line of text. */
export function parseInline(text: string): LexicalNode[] {
  const nodes: LexicalNode[] = []
  let remaining = text

  while (remaining.length > 0) {
    const match = INLINE_RE.exec(remaining)
    if (!match || match.index === undefined) {
      // No more inline patterns — rest is plain text
      if (remaining) nodes.push(makeTextNode(remaining))
      break
    }

    // Push plain text before the match
    if (match.index > 0) {
      nodes.push(makeTextNode(remaining.slice(0, match.index)))
    }

    const matched = match[1]

    if (matched.startsWith('**')) {
      // Bold: **text**
      const inner = matched.slice(2, -2)
      nodes.push(makeTextNode(inner, 1)) // format 1 = bold
    } else if (matched.startsWith('[')) {
      // Link: [text](url)
      const linkMatch = matched.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        nodes.push(makeLinkNode(linkMatch[1], linkMatch[2]))
      } else {
        nodes.push(makeTextNode(matched))
      }
    } else if (matched.startsWith('*')) {
      // Italic: *text*
      const inner = matched.slice(1, -1)
      nodes.push(makeTextNode(inner, 2)) // format 2 = italic
    }

    remaining = remaining.slice(match.index + matched.length)
  }

  // If nothing was parsed, ensure at least one empty text node
  if (nodes.length === 0) {
    nodes.push(makeTextNode(''))
  }

  return nodes
}

// ---------------------------------------------------------------------------
// Block-level markdown → Lexical JSON
// ---------------------------------------------------------------------------

function makeBlockProps(): Pick<LexicalNode, 'direction' | 'format' | 'indent'> {
  return { direction: 'ltr', format: '', indent: 0 }
}

function makeHeading(level: number, children: LexicalNode[]): LexicalNode {
  return {
    type: 'heading',
    version: 1,
    tag: `h${level}`,
    children,
    ...makeBlockProps(),
  }
}

function makeParagraph(children: LexicalNode[]): LexicalNode {
  return {
    type: 'paragraph',
    version: 1,
    children,
    textFormat: 0,
    textStyle: '',
    ...makeBlockProps(),
  }
}

function makeListItem(children: LexicalNode[], value: number): LexicalNode {
  return {
    type: 'listitem',
    version: 1,
    value,
    children,
    ...makeBlockProps(),
  }
}

function makeList(items: LexicalNode[]): LexicalNode {
  return {
    type: 'list',
    version: 1,
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    children: items,
    ...makeBlockProps(),
  }
}

function wrapRoot(children: LexicalNode[]): LexicalRoot {
  return {
    root: {
      type: 'root',
      version: 1,
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
    },
  }
}

/**
 * Convert markdown text to Payload CMS Lexical JSON.
 *
 * Handles:
 *   - Headings (# through ######)
 *   - Bold (**text**)
 *   - Italic (*text*)
 *   - Links [text](url) — preserves URLs
 *   - Bullet lists (- item or * item)
 *   - Paragraphs with inline formatting
 */
export function textToLexical(markdown: string): LexicalRoot {
  const lines = markdown.split('\n')
  const children: LexicalNode[] = []
  let listItems: LexicalNode[] = []
  let listCounter = 0

  function flushList() {
    if (listItems.length > 0) {
      children.push(makeList(listItems))
      listItems = []
      listCounter = 0
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Empty line: flush any open list, skip
    if (!trimmed) {
      flushList()
      continue
    }

    // Heading: # through ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      children.push(makeHeading(level, parseInline(headingMatch[2])))
      continue
    }

    // Bullet list item: - text or * text (but not **bold**)
    const listMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (listMatch && !trimmed.startsWith('**')) {
      listCounter++
      listItems.push(makeListItem(parseInline(listMatch[1]), listCounter))
      continue
    }

    // Regular paragraph
    flushList()
    children.push(makeParagraph(parseInline(trimmed)))
  }

  // Flush any trailing list
  flushList()

  return wrapRoot(children)
}

// ---------------------------------------------------------------------------
// Upload node helper
// ---------------------------------------------------------------------------

/** Create a Payload CMS Lexical upload block node for inline media. */
export function makeUploadNode(mediaId: string): LexicalNode {
  return {
    type: 'upload',
    version: 3,
    id: new (ObjectID as unknown as typeof ObjectID.default)().toHexString(),
    fields: null,
    relationTo: 'media',
    value: { id: mediaId },
  }
}

// ---------------------------------------------------------------------------
// Markdown → Lexical with inline section images
// ---------------------------------------------------------------------------

/**
 * Convert markdown to Lexical JSON, inserting upload nodes after ## headings.
 *
 * @param markdown - The markdown content to convert
 * @param sectionImages - Map of h2 heading index (0-based) to media ID
 */
export function textToLexicalWithImages(
  markdown: string,
  sectionImages: Map<number, string>
): LexicalRoot {
  const lines = markdown.split('\n')
  const children: LexicalNode[] = []
  let listItems: LexicalNode[] = []
  let listCounter = 0
  let h2Count = 0

  function flushList() {
    if (listItems.length > 0) {
      children.push(makeList(listItems))
      listItems = []
      listCounter = 0
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { flushList(); continue }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      children.push(makeHeading(level, parseInline(headingMatch[2])))
      // Insert image after ## headings if available
      if (level === 2) {
        const mediaId = sectionImages.get(h2Count)
        if (mediaId) {
          children.push(makeUploadNode(mediaId))
        }
        h2Count++
      }
      continue
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (listMatch && !trimmed.startsWith('**')) {
      listCounter++
      listItems.push(makeListItem(parseInline(listMatch[1]), listCounter))
      continue
    }

    flushList()
    children.push(makeParagraph(parseInline(trimmed)))
  }
  flushList()
  return wrapRoot(children)
}

// ---------------------------------------------------------------------------
// Issue / week number helpers
// ---------------------------------------------------------------------------

/** New issue number format: Y26W12 */
export function getIssueNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(2)
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
  return `Y${year}W${week.toString().padStart(2, '0')}`
}

/** Old format kept for backward compat (e.g. "2026-w07") */
export function getWeekNumber(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  const week = Math.ceil(diff / oneWeek)
  return `${now.getFullYear()}-w${week.toString().padStart(2, '0')}`
}
