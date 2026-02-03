# Phase 04: Agent System

## Context
- [OpenCode Agent System Research](./research/researcher-02-opencode-agent-system.md)
- [Cloudflare Infrastructure Research](./research/researcher-01-cloudflare-infrastructure.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-03 |
| Priority | P0 - Core Feature |
| Status | pending |
| Estimate | 8 hours |
| Depends On | Phase 02, Phase 03 |
| Description | Setup OpenCode agent system with Firecrawl MCP for automated content generation |

## Key Insights
From research:
- OpenCode config via `opencode.json` defines agent topology
- Firecrawl MCP: `scrape` (single page), `crawl` (spidering), `search` (Google)
- Primary/Subagent pattern: Editor-in-Chief delegates to specialists
- Vietnamese translation needs "re-contextualization" not direct translation
- Containers scale-to-zero (cost-effective for weekly runs)

## Requirements

### Functional
- Researcher agent: scrape English sources directly (same sources aigc-weekly uses)
- Writer agent: compose Vietnamese newsletter with "Góc nhìn của mình" section
- Reviewer agent: quality check before publish
- Language pipeline: English sources → Vietnamese output (independent of aigc-weekly)
- Reviewer agent: quality check before publish
- Integration with Payload CMS for content storage

### Non-Functional
- <5 min total execution time
- Cost <$0.50 per weekly generation
- Audit trail of agent decisions
- Rollback capability

## Architecture

```
Weekly Cron Trigger
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  Editor-in-Chief (Primary Agent)                        │
│  Model: claude-3-5-sonnet                               │
│  Role: Orchestrate workflow, review final output        │
└──────────────────────┬──────────────────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌─────────────────┐           ┌─────────────────┐
│   Researcher    │           │     Writer      │
│  gemini-2.0     │           │  claude-sonnet  │
│  +Firecrawl     │           │  Vietnamese +   │
│                 │           │  "Góc nhìn"     │
│ 1. Scrape aigc  │           └────────┬────────┘
│ 2. Get topics   │                    │
│ 3. Research EN  │                    ▼
│    sources      │           ┌─────────────────┐
└────────┬────────┘           │    Reviewer     │
         │                    │  claude-sonnet  │
         └────────────────────┴────────┬────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────┐
│  Payload CMS API                                        │
│  Create Weekly post (status: draft)                     │
└─────────────────────────────────────────────────────────┘
```

### Content Pipeline (Independent - Same Sources as aigc-weekly)
1. **Scrape English sources directly**:
   - Anthropic Blog, OpenAI Blog, Google AI Blog
   - Hugging Face Blog, Simon Willison's Blog
   - Hacker News AI topics, Twitter/X AI accounts
   - Product Hunt AI launches
2. **Researcher** → Curate top 10-15 items of the week
3. **Writer** → Synthesize in Vietnamese, add "Góc nhìn của mình" insights
4. **Reviewer** → Quality check, fix errors
5. **Publish** → Create draft in Payload CMS for human review

## Related Code Files

### New Files
| File | Purpose |
|------|---------|
| `opencode.json` | Agent configuration |
| `prompts/researcher.md` | Researcher system prompt |
| `prompts/translator.md` | Translator system prompt |
| `prompts/writer.md` | Writer system prompt |
| `prompts/reviewer.md` | Reviewer system prompt |
| `agents/primary.ts` | Orchestration logic |
| `agents/tools/payload-client.ts` | Payload API client |

## Implementation Steps

### Step 1: Setup OpenCode Configuration
**opencode.json**:
```json
{
  "version": "1.0",
  "project": "vn-ai-weekly",
  "agents": [
    {
      "name": "editor",
      "role": "Editor-in-Chief",
      "model": "claude-3-5-sonnet",
      "systemPromptPath": "./prompts/editor.md",
      "permissions": ["network", "file-read"],
      "allowedTools": ["researcher", "translator", "writer", "payload-api"]
    },
    {
      "name": "researcher",
      "role": "Data Gatherer",
      "model": "gemini-2.0-flash",
      "tools": ["firecrawl-mcp"],
      "systemPromptPath": "./prompts/researcher.md",
      "permissions": ["network"]
    },
    {
      "name": "translator",
      "role": "Localization",
      "model": "claude-3-opus",
      "systemPromptPath": "./prompts/translator.md",
      "permissions": []
    },
    {
      "name": "writer",
      "role": "Content Creator",
      "model": "claude-3-5-sonnet",
      "systemPromptPath": "./prompts/writer.md",
      "permissions": []
    }
  ],
  "routing": {
    "default": "editor"
  },
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "@mendable/firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}"
      }
    }
  }
}
```

### Step 2: Create Agent Prompts

**prompts/editor.md**:
```markdown
# Editor-in-Chief - VN AI Weekly

You orchestrate the weekly newsletter generation for Vietnamese AI Weekly.

## Workflow
1. Trigger Researcher to gather this week's AI news
2. Send gathered content to Translator for Vietnamese localization
3. Pass translated content to Writer for newsletter composition
4. Review final output for quality
5. Submit to Payload CMS

## Quality Standards
- Accuracy: All facts must be verifiable
- Tone: Professional yet engaging
- Structure: Highlights first, then categories
- Insight: Each post must include "Goc nhin cua minh" section

## Output Format
Return structured JSON for Payload API submission.
```

**prompts/researcher.md**:
```markdown
# Researcher Agent - VN AI Weekly

You gather AI news from multiple sources for the weekly newsletter.

## Primary Sources
1. aigc-weekly (https://aigc.dev) - Chinese AI news
2. The Batch (https://www.deeplearning.ai/the-batch/)
3. AI News (https://buttondown.email/ainews)
4. Simon Willison's blog (https://simonwillison.net)
5. Anthropic blog (https://www.anthropic.com/blog)

## Tools
- Use `firecrawl.scrape` for single pages
- Use `firecrawl.search` to find recent articles

## Output Format
Return structured list:
- title: Original title
- source_url: URL
- source_lang: "zh" | "en"
- summary: 2-3 sentence summary
- category: "models" | "tools" | "news" | "research"
- relevance_score: 1-10

## Filter Criteria
- Published within last 7 days
- Focus on: Models, Coding tools, Agent frameworks, Infrastructure
- Skip: Marketing fluff, Minor updates, Non-AI content
```

**prompts/translator.md**:
```markdown
# Translator Agent - VN AI Weekly

You translate and re-contextualize AI news for Vietnamese tech community.

## Approach
NOT direct translation. Re-contextualize for VN audience.

## Rules
1. **Terminology**: Use standard VN tech terms
   - "AI" or "Tri tue nhan tao" (not "Hoc may" unless formal)
   - Keep technical terms in English when common (API, LLM, MCP)

2. **Tone**: Professional yet engaging (Op-ed style)
   - First person when adding commentary
   - Direct, concise sentences

3. **Structure**:
   - Summary bullets first
   - Then detailed sections

4. **Links**: Preserve all original URLs

## Input Format
{source_lang: "zh" | "en", content: "..."}

## Output Format
{translated_content: "...", notes: ["..."]}
```

**prompts/writer.md**:
```markdown
# Writer Agent - VN AI Weekly

You compose the final newsletter from translated content.

## Newsletter Structure

```
# Tuan bao Tech & AI - Tuan XX/YYYY

[Opening paragraph - personal observation about the week's theme]

## Highlights cua tuan
- [Key highlight 1]
- [Key highlight 2]
- [Key highlight 3]

## Models
[New models section]

## Tools
[New tools section]

## Tin tuc dang chu y
[News section]

<div class="insight-box">
<strong>Goc nhin cua minh:</strong> [Personal insight about the week's developments]
</div>
```

## Tone Guidelines
- Use "minh" for first person (casual, approachable)
- Short sentences, active voice
- Include "Dang thu" or "Theo doi" for recommendations
- Honest about limitations ("Minh nghi", "Chua ro")

## Personal Insight Requirements
The "Goc nhin cua minh" section must:
- Identify a theme or pattern
- Provide original perspective
- Be ~2-3 sentences
- Not just summarize the news
```

### Step 3: Create Payload API Client

**agents/tools/payload-client.ts**:
```typescript
interface WeeklyPost {
  title: string
  slug: string
  excerpt: string
  content: string
  tag: string
  tagColor: string
  publishedAt: string
  readTime: string
  status: 'draft' | 'review' | 'published'
  personalInsight: string
}

export async function createWeeklyPost(
  post: WeeklyPost,
  options: { apiUrl: string; apiKey: string }
) {
  const response = await fetch(`${options.apiUrl}/api/weekly`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(post),
  })

  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.statusText}`)
  }

  return response.json()
}

export async function updateWeeklyPost(
  id: string,
  updates: Partial<WeeklyPost>,
  options: { apiUrl: string; apiKey: string }
) {
  const response = await fetch(`${options.apiUrl}/api/weekly/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error(`Failed to update post: ${response.statusText}`)
  }

  return response.json()
}
```

### Step 4: Create Orchestration Script

**agents/primary.ts**:
```typescript
import { spawn } from 'child_process'
import { createWeeklyPost } from './tools/payload-client'

interface AgentConfig {
  name: string
  model: string
  prompt: string
}

async function runAgent(agent: AgentConfig, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('opencode', [
      'run',
      '--agent', agent.name,
      '--input', input,
    ])

    let output = ''
    proc.stdout.on('data', (data) => {
      output += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output)
      } else {
        reject(new Error(`Agent ${agent.name} failed with code ${code}`))
      }
    })
  })
}

async function generateWeekly() {
  const weekNumber = getISOWeek(new Date())
  const year = new Date().getFullYear()

  console.log(`Generating VN AI Weekly - Week ${weekNumber}/${year}`)

  // Step 1: Research
  console.log('1. Gathering news...')
  const researchOutput = await runAgent(
    { name: 'researcher', model: 'gemini-2.0-flash', prompt: '' },
    JSON.stringify({ week: weekNumber, year })
  )

  // Step 2: Translate
  console.log('2. Translating content...')
  const translatedOutput = await runAgent(
    { name: 'translator', model: 'claude-3-opus', prompt: '' },
    researchOutput
  )

  // Step 3: Write
  console.log('3. Composing newsletter...')
  const draftOutput = await runAgent(
    { name: 'writer', model: 'claude-3-5-sonnet', prompt: '' },
    translatedOutput
  )

  // Step 4: Parse and submit
  const draft = JSON.parse(draftOutput)

  console.log('4. Submitting to CMS...')
  const created = await createWeeklyPost({
    title: `Tuan bao Tech & AI - Tuan ${String(weekNumber).padStart(2, '0')}/${year}`,
    slug: `${year}-w${String(weekNumber).padStart(2, '0')}`,
    excerpt: draft.excerpt,
    content: draft.content,
    tag: 'ai-weekly',
    tagColor: 'blue',
    publishedAt: new Date().toISOString(),
    readTime: `${Math.ceil(draft.content.length / 1000)} min read`,
    status: 'review', // Human reviews before publish
    personalInsight: draft.insight,
  }, {
    apiUrl: process.env.PAYLOAD_API_URL!,
    apiKey: process.env.PAYLOAD_API_KEY!,
  })

  console.log(`Created draft: ${created.id}`)
  console.log('Awaiting human review...')
}

generateWeekly().catch(console.error)
```

### Step 5: Configure Firecrawl MCP

```bash
# Get Firecrawl API key from firecrawl.dev
# Add to .dev.vars
FIRECRAWL_API_KEY=fc-...

# Test MCP connection
npx @mendable/firecrawl-mcp --help
```

### Step 6: Create Container Dockerfile

**Dockerfile.agent**:
```dockerfile
FROM node:20-slim

WORKDIR /app

# Install OpenCode CLI
RUN npm install -g opencode

# Copy agent configuration
COPY opencode.json .
COPY prompts/ ./prompts/
COPY agents/ ./agents/

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Entry point
CMD ["node", "agents/primary.js"]
```

### Step 7: Test Locally

```bash
# Set environment variables
export FIRECRAWL_API_KEY=fc-...
export PAYLOAD_API_URL=http://localhost:3000
export PAYLOAD_API_KEY=...

# Run agent manually
opencode run --agent editor --input '{"command": "generate-weekly"}'
```

## Todo List
- [ ] Create `opencode.json` configuration
- [ ] Write `prompts/editor.md`
- [ ] Write `prompts/researcher.md`
- [ ] Write `prompts/translator.md`
- [ ] Write `prompts/writer.md`
- [ ] Create Payload API client
- [ ] Create orchestration script
- [ ] Setup Firecrawl MCP
- [ ] Get Firecrawl API key
- [ ] Create agent Dockerfile
- [ ] Test researcher with Firecrawl
- [ ] Test translator with sample content
- [ ] Test writer output format
- [ ] Test end-to-end locally
- [ ] Fine-tune prompts based on output quality

## Success Criteria
- [ ] Researcher returns structured news list
- [ ] Translator produces natural Vietnamese
- [ ] Writer follows newsletter structure
- [ ] "Goc nhin" section is thoughtful (not generic)
- [ ] Content submitted to Payload as draft
- [ ] <5 min total execution
- [ ] Agent logs captured for debugging

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Firecrawl rate limits | Med | Med | Cache responses, batch requests |
| Translation quality | Med | High | Human review step, prompt iteration |
| Source site changes | Med | Med | Multiple sources, fallback logic |
| Model hallucinations | Low | High | Fact-check in reviewer, source URLs |
| API cost overruns | Low | Med | Token budgets per agent, monitoring |

## Security Considerations
- API keys in environment variables only
- Agent permissions minimized
- Firecrawl key scoped to read operations
- Payload API key with limited scope (weekly collection only)
- Audit log of all agent actions

## Next Steps
After completion:
1. Proceed to [Phase 05: Automation & Deploy](./phase-05-automation-deploy.md)
2. Setup cron trigger for weekly runs
3. Configure notification on draft ready
