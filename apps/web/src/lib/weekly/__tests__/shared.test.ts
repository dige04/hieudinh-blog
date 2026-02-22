/**
 * Test suite for the weekly pipeline upgrade.
 *
 * Run: npx tsx apps/web/src/lib/weekly/__tests__/shared.test.ts
 */

import assert from 'node:assert'
import { textToLexical, parseInline, getIssueNumber, getWeekNumber } from '../shared'
import { WEEKLY_SOURCES, getSourcesByTier, getSourceBatches } from '../sources'
import { VIETNAMESE_STYLE_GUIDE, REVIEW_CHECKLIST } from '../style-guide'

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    failed++
    console.log(`  ✗ ${name}`)
    console.log(`    ${(err as Error).message}`)
  }
}

// ===========================================================================
// textToLexical tests
// ===========================================================================
console.log('\n--- textToLexical ---')

test('converts plain paragraph', () => {
  const result = textToLexical('Hello world')
  assert.strictEqual(result.root.children.length, 1)
  assert.strictEqual(result.root.children[0].type, 'paragraph')
  assert.strictEqual(result.root.children[0].children![0].text, 'Hello world')
})

test('converts h1 heading', () => {
  const result = textToLexical('# Main Title')
  assert.strictEqual(result.root.children.length, 1)
  const heading = result.root.children[0]
  assert.strictEqual(heading.type, 'heading')
  assert.strictEqual(heading.tag, 'h1')
  assert.strictEqual(heading.children![0].text, 'Main Title')
})

test('converts h2 heading', () => {
  const result = textToLexical('## Section Title')
  const heading = result.root.children[0]
  assert.strictEqual(heading.type, 'heading')
  assert.strictEqual(heading.tag, 'h2')
})

test('converts h3 heading', () => {
  const result = textToLexical('### Sub Section')
  const heading = result.root.children[0]
  assert.strictEqual(heading.type, 'heading')
  assert.strictEqual(heading.tag, 'h3')
})

test('converts bold text', () => {
  const result = textToLexical('This is **bold** text')
  const children = result.root.children[0].children!
  assert.strictEqual(children.length, 3)
  assert.strictEqual(children[0].text, 'This is ')
  assert.strictEqual(children[0].format, 0)
  assert.strictEqual(children[1].text, 'bold')
  assert.strictEqual(children[1].format, 1) // bold = 1
  assert.strictEqual(children[2].text, ' text')
})

test('converts italic text', () => {
  const result = textToLexical('This is *italic* text')
  const children = result.root.children[0].children!
  assert.strictEqual(children[1].text, 'italic')
  assert.strictEqual(children[1].format, 2) // italic = 2
})

test('preserves links with URLs', () => {
  const result = textToLexical('Check out [Google](https://google.com) here')
  const children = result.root.children[0].children!
  assert.strictEqual(children.length, 3)
  assert.strictEqual(children[0].text, 'Check out ')
  assert.strictEqual(children[1].type, 'link')
  assert.strictEqual(children[1].fields?.url, 'https://google.com')
  assert.strictEqual(children[1].children![0].text, 'Google')
  assert.strictEqual(children[2].text, ' here')
})

test('link node has correct Payload CMS Lexical properties', () => {
  const result = textToLexical('[test](https://example.com)')
  const link = result.root.children[0].children![0]
  assert.strictEqual(link.type, 'link')
  assert.strictEqual(link.version, 3)
  assert.strictEqual(link.fields?.linkType, 'custom')
  assert.strictEqual(link.fields?.url, 'https://example.com')
  assert.strictEqual(link.fields?.newTab, false)
  assert.ok(typeof link.id === 'string' && link.id.length > 0, 'link should have an id')
  assert.strictEqual(link.direction, 'ltr')
})

test('converts bullet list with - markers', () => {
  const result = textToLexical('- Item 1\n- Item 2\n- Item 3')
  assert.strictEqual(result.root.children.length, 1)
  const list = result.root.children[0]
  assert.strictEqual(list.type, 'list')
  assert.strictEqual(list.listType, 'bullet')
  assert.strictEqual(list.tag, 'ul')
  assert.strictEqual(list.children!.length, 3)
  assert.strictEqual(list.children![0].type, 'listitem')
  assert.strictEqual(list.children![0].children![0].text, 'Item 1')
  assert.strictEqual(list.children![1].children![0].text, 'Item 2')
})

test('handles list items with inline links', () => {
  const result = textToLexical('- Check [this](https://example.com) out')
  const listItem = result.root.children[0].children![0]
  assert.strictEqual(listItem.children!.length, 3)
  assert.strictEqual(listItem.children![0].text, 'Check ')
  assert.strictEqual(listItem.children![1].type, 'link')
  assert.strictEqual(listItem.children![1].fields?.url, 'https://example.com')
})

test('mixed content: heading + paragraphs + list + heading', () => {
  const md = `## Tin tuc

Paragraph one with **bold**.

- Item A
- Item B

## Cong cu

Paragraph two with [link](https://example.com).`

  const result = textToLexical(md)
  const types = result.root.children.map((c) => c.type)
  assert.deepStrictEqual(types, ['heading', 'paragraph', 'list', 'heading', 'paragraph'])
})

test('empty lines break lists', () => {
  const md = `- Item 1

- Item 2`
  const result = textToLexical(md)
  // Two separate lists due to empty line between them
  assert.strictEqual(result.root.children.length, 2)
  assert.strictEqual(result.root.children[0].type, 'list')
  assert.strictEqual(result.root.children[1].type, 'list')
})

test('empty input produces empty root', () => {
  const result = textToLexical('')
  assert.strictEqual(result.root.children.length, 0)
  assert.strictEqual(result.root.type, 'root')
  assert.strictEqual(result.root.version, 1)
})

test('handles heading with inline link', () => {
  const result = textToLexical('## [Gemini 3](https://deepmind.google) ra mat')
  const heading = result.root.children[0]
  assert.strictEqual(heading.type, 'heading')
  assert.strictEqual(heading.children![0].type, 'link')
  assert.strictEqual(heading.children![0].fields?.url, 'https://deepmind.google')
  assert.strictEqual(heading.children![1].text, ' ra mat')
})

test('does not treat **bold** at start of line as list item', () => {
  const result = textToLexical('**Bold start** of paragraph')
  assert.strictEqual(result.root.children[0].type, 'paragraph')
  assert.strictEqual(result.root.children[0].children![0].text, 'Bold start')
  assert.strictEqual(result.root.children[0].children![0].format, 1)
})

test('text nodes have correct Lexical properties', () => {
  const result = textToLexical('Hello')
  const textNode = result.root.children[0].children![0]
  assert.strictEqual(textNode.type, 'text')
  assert.strictEqual(textNode.version, 1)
  assert.strictEqual(textNode.detail, 0)
  assert.strictEqual(textNode.mode, 'normal')
  assert.strictEqual(textNode.style, '')
})

test('paragraph nodes have textFormat and textStyle', () => {
  const result = textToLexical('Hello')
  const para = result.root.children[0]
  assert.strictEqual(para.textFormat, 0)
  assert.strictEqual(para.textStyle, '')
})

// ===========================================================================
// parseInline tests
// ===========================================================================
console.log('\n--- parseInline ---')

test('plain text returns single text node', () => {
  const nodes = parseInline('just text')
  assert.strictEqual(nodes.length, 1)
  assert.strictEqual(nodes[0].text, 'just text')
  assert.strictEqual(nodes[0].format, 0)
})

test('multiple bold segments', () => {
  const nodes = parseInline('**a** and **b**')
  assert.strictEqual(nodes.length, 3)
  assert.strictEqual(nodes[0].text, 'a')
  assert.strictEqual(nodes[0].format, 1)
  assert.strictEqual(nodes[1].text, ' and ')
  assert.strictEqual(nodes[2].text, 'b')
  assert.strictEqual(nodes[2].format, 1)
})

test('link followed by text', () => {
  const nodes = parseInline('[Click](https://x.com) here')
  assert.strictEqual(nodes.length, 2)
  assert.strictEqual(nodes[0].type, 'link')
  assert.strictEqual(nodes[0].fields?.url, 'https://x.com')
  assert.strictEqual(nodes[1].text, ' here')
})

test('empty string returns empty text node', () => {
  const nodes = parseInline('')
  assert.strictEqual(nodes.length, 1)
  assert.strictEqual(nodes[0].text, '')
})

// ===========================================================================
// sources.ts tests
// ===========================================================================
console.log('\n--- sources ---')

test('WEEKLY_SOURCES has 20+ sources', () => {
  assert.ok(WEEKLY_SOURCES.length >= 20, `Expected >= 20, got ${WEEKLY_SOURCES.length}`)
})

test('all sources have required fields', () => {
  for (const source of WEEKLY_SOURCES) {
    assert.ok(source.url, `Missing url on ${source.name}`)
    assert.ok(source.name, 'Missing name')
    assert.ok([1, 2, 3].includes(source.tier), `Invalid tier: ${source.tier}`)
    assert.ok(['rss', 'web', 'api'].includes(source.type), `Invalid type: ${source.type}`)
  }
})

test('getSourcesByTier returns correct counts', () => {
  const tier1 = getSourcesByTier(1)
  const tier2 = getSourcesByTier(2)
  const tier3 = getSourcesByTier(3)
  assert.ok(tier1.length >= 4, `Tier 1 should have >= 4 sources, got ${tier1.length}`)
  assert.ok(tier2.length >= 5, `Tier 2 should have >= 5 sources, got ${tier2.length}`)
  assert.ok(tier3.length >= 3, `Tier 3 should have >= 3 sources, got ${tier3.length}`)
})

test('getSourceBatches returns 3 batches', () => {
  const batches = getSourceBatches()
  assert.strictEqual(batches.length, 3)
  assert.strictEqual(batches[0].length, getSourcesByTier(1).length)
})

// ===========================================================================
// style-guide.ts tests
// ===========================================================================
console.log('\n--- style-guide ---')

test('VIETNAMESE_STYLE_GUIDE is non-empty string', () => {
  assert.ok(typeof VIETNAMESE_STYLE_GUIDE === 'string')
  assert.ok(VIETNAMESE_STYLE_GUIDE.length > 500, 'Style guide should be substantial')
})

test('style guide contains key sections', () => {
  assert.ok(VIETNAMESE_STYLE_GUIDE.includes('De-AI-ification'), 'Missing de-AI section')
  assert.ok(VIETNAMESE_STYLE_GUIDE.includes('Link Rules'), 'Missing link rules')
  assert.ok(VIETNAMESE_STYLE_GUIDE.includes('Giọng điệu'), 'Missing tone section')
})

test('REVIEW_CHECKLIST has 7 items', () => {
  assert.strictEqual(REVIEW_CHECKLIST.length, 7)
})

// ===========================================================================
// Helper function tests
// ===========================================================================
console.log('\n--- helpers ---')

test('getIssueNumber returns Y__W__ format', () => {
  const issue = getIssueNumber()
  assert.ok(/^Y\d{2}W\d{2}$/.test(issue), `Invalid format: ${issue}`)
})

test('getWeekNumber returns YYYY-wWW format', () => {
  const week = getWeekNumber()
  assert.ok(/^\d{4}-w\d{2}$/.test(week), `Invalid format: ${week}`)
})

// ===========================================================================
// Summary
// ===========================================================================
console.log(`\n${'='.repeat(40)}`)
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`)
if (failed > 0) {
  console.log('\nFAILED')
  process.exit(1)
} else {
  console.log('\nALL TESTS PASSED')
}
