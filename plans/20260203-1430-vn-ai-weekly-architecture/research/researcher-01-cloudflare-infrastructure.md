# Cloudflare Infrastructure Research for AI Agent Hosting

## 1. Cloudflare Containers (Workers Containers)
**Status**: Public Beta (Early 2026)
**Best For**: Event-driven AI agents, specialized runtimes (Python/Node.js/Go) that need Docker.

- **Deployment**:
  - Deploy standard Docker images via `wrangler` or CI/CD.
  - "Scale-to-zero" architecture (cost-effective for bursty agent tasks).
  - Faster cold-starts than AWS Fargate but slower than V8 Workers.
- **Pricing**:
  - Requires **Workers Paid Plan** ($5/mo).
  - **Memory**: $0.0000025 per GiB-second (25 GiB-hours included).
  - **vCPU**: $0.000020 per vCPU-second (375 vCPU-minutes included).
  - **Billing**: 10ms increments; charges stop when container sleeps.
- **Limitations**:
  - **Resource Caps**: ~4 vCPUs / 8GB RAM per instance (Beta).
  - **State**: Ephemeral. Must use D1, KV, or Durable Objects for persistence.
  - **No GPU**: GPU access requires calling Workers AI API, not local container inference.

## 2. Cloudflare D1 (SQLite) & Payload CMS
**Status**: D1 is GA; Payload Adapter is Beta (Production Ready).
**Best For**: CMS data, agent memory, structured logs.

- **Payload CMS 3.0 Compatibility**:
  - **Official Adapter**: `@payloadcms/db-d1-sqlite` (uses Drizzle ORM).
  - **Architecture**: Next.js-native (Payload 3.0) runs on Workers via OpenNext.
  - **Deployment**: Deploys as a Worker (monolith) or microservices.
- **Capabilities**:
  - **Reads**: Extremely fast edge reads.
  - **Writes**: Asynchronous replication; strong consistency available.
  - **Size**: Database size up to 10GB (Paid), 500MB (Free).
- **Cost**:
  - **Reads**: $0.001 per million.
  - **Writes**: $1.00 per million.
  - **Storage**: $0.75 per GB/mo.

## 3. Cloudflare R2 (Object Storage)
**Status**: GA.
**Best For**: Agent artifacts (images, PDFs), CMS media assets.

- **Integration**:
  - **Payload**: `@payloadcms/storage-r2` or `@payloadcms/storage-s3` (S3 compatible).
  - **Workers**: Native binding `env.BUCKET.put()`.
- **Pricing (Killer Feature)**:
  - **Egress Fees**: **$0** (Free).
  - **Storage**: $0.015 per GB/mo.
  - **Class A Ops (Mutate)**: $4.50 / million.
  - **Class B Ops (Read)**: $0.36 / million.
- **Pattern**: Agents generate content → Save to R2 → Trigger Worker to process/index.

## 4. Cloudflare Workers & Orchestration
**Status**: GA.
**Best For**: Router, Cron jobs, Lightweight logic.

- **Cron Triggers**:
  - Native support in `wrangler.toml` (`[triggers] crons = ["* * * * *"]`).
  - Free: Standard Workers limits.
- **Orchestration Pattern**:
  1. **Cron Worker** wakes up.
  2. Checks D1 for pending jobs.
  3. Dispatches job to **Workers Container** (heavy lift) or **Workers AI** (inference).
  4. Stores result in D1/R2.

## 5. OpenNext.js (Next.js on Cloudflare)
**Status**: Recommended approach for Next.js 14/15+ on Cloudflare.
**Best For**: Hosting the Payload CMS Admin UI and frontend.

- **Why OpenNext?**:
  - Bridges Next.js server features to Workers runtime.
  - Superior Node.js polyfill support compared to `next-on-pages`.
  - Recommended by Cloudflare & Payload teams for v3.0 deployments.
- **Constraint**:
  - **Bundle Size**: Paid plan ($5/mo) strongly recommended to avoid 3MB free tier compressed script limit.
  - **Image Optimization**: Use Cloudflare Images or R2, as `next/image` default optimization is heavy on CPU.

## Summary Recommendation
- **Core**: Workers Paid Plan ($5/mo).
- **Database**: D1 (via Payload Adapter).
- **Storage**: R2 (Zero egress).
- **Compute**: Workers (Orchestrator/API) + Containers (Heavy Agents) + Workers AI (LLMs).
- **Frontend**: OpenNext.js on Workers.
