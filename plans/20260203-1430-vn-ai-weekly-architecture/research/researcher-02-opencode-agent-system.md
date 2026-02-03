# OpenCode Agent Runtime Research

## 1. OpenCode Configuration
**Note**: "OpenCode" appears to be the specific agent runtime environment.
*Structure*: `opencode.json` defines the agent topology.
*Key Fields*:
- `agents`: Array of agent definitions.
- `routing`: Rules for dispatching tasks (e.g., regex on input, topic classification).
- `models`: Default and per-agent model overrides (e.g., `claude-3-5-sonnet` for logic, `haiku` for summarization).

```json
{
  "version": "1.0",
  "agents": [
    {
      "name": "researcher",
      "role": "Data Gatherer",
      "model": "gemini-2.0-flash",
      "tools": ["firecrawl-mcp"],
      "permissions": ["network"]
    },
    {
      "name": "translator",
      "role": "Localization",
      "model": "claude-3-opus",
      "systemPromptPath": "./prompts/translator.md"
    }
  ],
  "routing": {
    "default": "researcher"
  }
}
```

## 2. MCP Integration (Firecrawl)
*Firecrawl MCP*: Specialized for turning websites into LLM-ready markdown.
*Configuration*:
- Add to `mcpServers` in `claude_desktop_config.json` or `opencode.json` (if supported).
- Capabilities: `scrape` (single page), `crawl` (spidering), `search` (Google wrapper).

```json
"firecrawl": {
  "command": "npx",
  "args": ["-y", "@mendable/firecrawl-mcp"],
  "env": { "FIRECRAWL_API_KEY": "fc-..." }
}
```

## 3. Agent Orchestration
*Primary/Subagent Pattern*:
- **Primary Agent**: "Editor-in-Chief". Receives triggers, plans execution, delegates to subagents.
- **Subagents**: Specialized workers (Scraper, Analyst, Translator).
*Permission Model*:
- Explicit allow-listing of MCP tools per agent to prevent tool leakage.
- `opencode.json` should specify `allowedTools` for each agent.

## 4. Vietnamese Translation Strategy
*Insight*: Direct translation loses nuance. Use a "re-contextualization" approach.
*Prompt Template*:
```markdown
Role: Expert Tech Translator (Chinese -> Vietnamese)
Task: Translate AI news preserving technical accuracy but adapting tone for VN tech community.
Rules:
1. Terminology: Use standard VN tech terms (e.g., "Trí tuệ nhân tạo" or keep "AI", not "Học máy" unless formal).
2. Tone: Professional yet engaging (Op-ed style).
3. Structure: Summary bullet points first, then deep dive.
Input: {chinese_text}
```

## 5. Scheduled Automation
*Triggering*:
- Use system `cron` or GitHub Actions to trigger the OpenCode runtime.
- Command: `opencode run --agent primary --input "daily-digest"`
*Session Management*:
- OpenCode maintains state in `.opencode/sessions/`.
- Ensure cleanup of old sessions via post-run scripts to prevent disk bloat.

## Unresolved Questions
1. Does OpenCode support dynamic agent spinning based on crawl volume?
2. What is the specific syntax for `routing` in `opencode.json` (regex vs semantic)?
