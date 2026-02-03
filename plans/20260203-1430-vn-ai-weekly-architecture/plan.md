# Vietnamese AI Weekly - Architecture Fork Plan

## Overview
Fork aigc-weekly architecture to create automated Vietnamese AI Weekly newsletter platform.

**Stack**: Next.js 15 + Payload CMS 3.0 + Supabase (PostgreSQL/Storage) + Cloud Run (Agents) + Cloudflare Pages

**Cost**: $0/month (GCP credits + free tiers)

## Current State
- 4 existing posts (W01-W04 2026) in `src/data/blogData.ts`
- Vite + React Router SPA (to be replaced)
- Shadcn UI components (~45, portable)

## Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project approach | Fresh Next.js | Cleaner separation, avoid Vite artifacts |
| Language | Vietnamese only | Target audience, no dual-lang complexity |
| Insights workflow | Semi-automated | Agent drafts "Goc nhin", human reviews |
| Content sources | aigc-weekly + direct scraping | Redundancy, broader coverage |

## Phases

| Phase | Status | Est. | File |
|-------|--------|------|------|
| 01: Infrastructure Setup | pending | 4h | [phase-01-infrastructure.md](./phase-01-infrastructure.md) |
| 02: Next.js + Payload CMS | pending | 6h | [phase-02-nextjs-payload.md](./phase-02-nextjs-payload.md) |
| 03: Content Migration | pending | 2h | [phase-03-content-migration.md](./phase-03-content-migration.md) |
| 04: Agent System | pending | 8h | [phase-04-agent-system.md](./phase-04-agent-system.md) |
| 05: Automation & Deploy | pending | 4h | [phase-05-automation-deploy.md](./phase-05-automation-deploy.md) |

**Total Estimate**: 24 hours

## Architecture Diagram
```
Cloud Scheduler ──▶ Cloud Run (OpenCode Agent) ──▶ Supabase (PostgreSQL + Storage)
     (weekly)         - Firecrawl MCP                         │
                      - Your API keys                         ▼
                      - Translate + Insights          Cloudflare Pages
                                                      (Next.js + Payload)
```

## Research References
- [Cloudflare Infrastructure](./research/researcher-01-cloudflare-infrastructure.md)
- [OpenCode Agent System](./research/researcher-02-opencode-agent-system.md)
- [Current Codebase Scout](./scout/scout-01-current-codebase.md)

## Risk Summary
| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase Postgres adapter | Low | Well-tested, official Payload adapter |
| Cloud Run cold starts | Low | Min instances = 1 or pre-warm |
| Translation quality | Med | Human review gate before publish |

## Success Criteria
- [ ] Weekly auto-generation working end-to-end
- [ ] <2s page load (Lighthouse >90)
- [ ] Zero manual steps for content pipeline
- [ ] Human review step for quality gate
