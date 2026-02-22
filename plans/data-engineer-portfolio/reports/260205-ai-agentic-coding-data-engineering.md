# Research Report: AI/Agentic Coding + Data Engineering Portfolio Project

**Date**: 2026-02-05
**Target**: Fresh graduate wanting to combine AI/Agentic Coding with Data Engineering
**Focus**: Academic research, industry trends, and Claude Code ecosystem

---

## Executive Summary

Năm 2025 đánh dấu **"Agentic Era"** trong software development - chuyển từ "AI-as-copilot" sang "AI-as-autopilot". Đây là thời điểm vàng để build portfolio project kết hợp:

1. **Agentic AI** (Claude Code, SWE-agent, OpenHands)
2. **Data Engineering** (pipelines, vector databases, feature stores)
3. **LLMOps** (RAG pipelines, model monitoring, fine-tuning)

**Top Recommendation**: Build một **AI Agent Platform** với data pipeline backend - ví dụ:
- RAG pipeline với vector database
- Agent memory system với persistent storage
- MCP (Model Context Protocol) server tùy chỉnh
- Hoặc contribute vào Claude Code ecosystem

---

## Part 1: Academic Research (2024-2025)

### Key Papers & Conferences

| Paper | Authors | Focus |
|-------|---------|-------|
| Voyager | Guanzhi Wang et al. | LLM-powered lifelong learning agent (Minecraft) |
| Reflexion | Noah Shinn et al. | Reinforcing agents through linguistic feedback |
| SWE-agent | Princeton/Stanford | Autonomous software engineering agents |
| ToolLLM | - | Framework for LLMs to use tools |
| LLM Agents can Autonomously Exploit Vulnerabilities | Fang, Bindu, Gupta, Kang | Security implications |

### Key Researchers to Follow

| Researcher | Affiliation | Focus |
|------------|-------------|-------|
| Yiheng Xu | OpenAI | Autonomous coding agents (Lemur, Qwen3 Coder) |
| Daniel Kang | - | LLM agents security |
| Noah Shinn | - | Reflexion framework |
| Guanzhi Wang | - | Voyager agent |

### Conferences to Watch

- **NeurIPS 2024/2025** - AI agents track
- **ICML 2024/2025** - Machine learning agents
- **ACL 2024/2025** - Language model agents
- **USENIX Security 2025** - Agent security

---

## Part 2: Industry Trends (2025)

### Agentic Coding Tools Landscape

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENTIC CODING TOOLS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Terminal-Based          IDE-Integrated         Autonomous      │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐ │
│  │ Claude Code  │       │   Cursor     │       │   Devin AI   │ │
│  │ (Anthropic)  │       │   Windsurf   │       │ (Cognition)  │ │
│  └──────────────┘       │   Copilot    │       └──────────────┘ │
│                         └──────────────┘                         │
│                                                                  │
│  Open Source                                                     │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐ │
│  │  OpenHands   │       │  SWE-agent   │       │   AutoGPT    │ │
│  │              │       │              │       │              │ │
│  └──────────────┘       └──────────────┘       └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Market Predictions

- **25%** companies using GenAI will pilot agentic AI in 2025 (Deloitte)
- **50%** by 2027
- **$4B+** market for autonomous AI agents by 2028 (Gartner)

### Key Technologies Emerging

| Technology | Description | Why Important |
|------------|-------------|---------------|
| MCP (Model Context Protocol) | Open standard for AI ↔ tools | Anthropic-led, becoming industry standard |
| Agent SDKs | Claude Agent SDK, OpenAI AgentKit, Google ADK | Official frameworks for building agents |
| Vector Databases | Pinecone, Weaviate, Qdrant, Milvus | Foundation for RAG and memory systems |
| Parallel Runners | Multiple agents working concurrently | Scaling agent workloads |

---

## Part 3: Claude Code Ecosystem (Hot Topic 🔥)

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ CLAUDE.md   │    │    MCP      │    │   Hooks     │         │
│  │ (Memory)    │    │  (Tools)    │    │ (Automation)│         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Claude Code CLI                          ││
│  └─────────────────────────────────────────────────────────────┘│
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Skills    │    │  Sub-agents │    │  Workflows  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Popular Open Source Projects

| Project | Description | GitHub Stars |
|---------|-------------|--------------|
| **Claude Taskmaster** | AI project manager for Claude Code | Growing |
| **Claude-Flow** | Multi-agent collaboration framework | Hot |
| **Claude Squad** | Manage multiple AI coding agents | Popular |
| **SuperClaude Framework** | Enhanced commands + cognitive roles | Community favorite |
| **Memory Bank MCP** | Persistent memory for Claude | Essential |
| **MCP Servers Collection** | GitHub, PostgreSQL, Notion, etc. | Official |

### Key Concepts to Master

1. **CLAUDE.md** - Project memory file
   ```markdown
   # Project: My App
   ## Commands
   - `pnpm dev` - Start dev server
   - `pnpm test` - Run tests

   ## Architecture
   - Next.js App Router
   - PostgreSQL + Drizzle ORM

   ## Rules
   - Use TypeScript strict mode
   - Follow conventional commits
   ```

2. **MCP (Model Context Protocol)**
   - Connect Claude to external tools
   - Examples: GitHub, databases, browsers, APIs
   - Write custom MCP servers in TypeScript/Python

3. **Hooks**
   - Shell commands triggered at lifecycle points
   - `PreToolUse`, `PostToolUse`, etc.
   - Enforce rules, automate tasks

4. **Skills**
   - Custom slash commands
   - Reusable workflows
   - Example: `/commit`, `/deploy`, `/test`

---

## Part 4: Project Ideas (Kết Hợp AI + Data Engineering)

### Tier 1: Beginner-Friendly (1-2 months)

#### 1. RAG Pipeline với Vector Database
```
Documents → Chunking → Embeddings → Vector DB → LLM Query
    │                                    │
    └── Airflow/Prefect orchestration ───┘
```

**Stack**: LangChain, Qdrant/Weaviate, Sentence Transformers, FastAPI, Docker

**Data Engineering**: Document ingestion pipeline, embedding computation, vector storage management

#### 2. LLM Usage Analytics Dashboard
```
LLM API Calls → Kafka → Spark → PostgreSQL → Grafana
                               │
                               └── Cost tracking, latency, tokens
```

**Stack**: Kafka, PySpark, PostgreSQL, Grafana, Docker

**AI Aspect**: Monitor LLM usage patterns, detect anomalies

---

### Tier 2: Intermediate (2-3 months)

#### 3. Custom MCP Server for Data Pipeline
**Concept**: Build MCP server that lets Claude Code interact with your data infrastructure

```python
# Example MCP Server
@mcp.tool()
def query_data_warehouse(query: str) -> str:
    """Execute SQL query on BigQuery"""
    return bigquery_client.query(query).to_dataframe().to_json()

@mcp.tool()
def trigger_airflow_dag(dag_id: str) -> str:
    """Trigger an Airflow DAG run"""
    return airflow_api.trigger_dag(dag_id)

@mcp.tool()
def get_feature_from_store(feature_name: str, entity_id: str) -> dict:
    """Fetch feature from Feast feature store"""
    return feast_client.get_online_features(feature_name, entity_id)
```

**Why Impressive**: Shows you understand both AI tooling AND data infrastructure

#### 4. Agent Memory System with Data Pipeline
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Agent       │───▶│ Memory      │───▶│ Vector DB   │
│ Conversations│    │ Extraction  │    │ (Qdrant)    │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Knowledge   │
                   │ Graph (Neo4j)│
                   └─────────────┘
```

**Stack**: Kafka (ingestion), Spark (processing), Qdrant + Neo4j (storage), FastAPI

---

### Tier 3: Advanced (3-6 months)

#### 5. Multi-Agent Code Review System
```
┌─────────────┐    ┌─────────────────────────────────┐
│ GitHub      │───▶│ Agent Orchestrator              │
│ Webhook     │    │  ├── Security Agent             │
└─────────────┘    │  ├── Performance Agent          │
                   │  ├── Style Agent                │
                   │  └── Documentation Agent        │
                   └─────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────────────────┐
                   │ Results Aggregator + PR Comment │
                   └─────────────────────────────────┘
```

**Stack**: FastAPI, Claude/OpenAI API, GitHub API, Redis (caching), PostgreSQL (results)

#### 6. LLMOps Platform (MLOps cho LLMs)
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Prompt      │───▶│ Experiment  │───▶│ Deployment  │
│ Management  │    │ Tracking    │    │ Pipeline    │
└─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │
      ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────┐
│ Monitoring: Latency, Cost, Quality, Drift           │
└─────────────────────────────────────────────────────┘
```

**Stack**: MLflow/Weights & Biases, LangSmith, Prometheus, Grafana, Kubernetes

---

## Part 5: Recommended Project for You

### 🏆 Top Pick: Custom MCP Server + RAG Pipeline

**Why This Project?**

| Criteria | Score |
|----------|-------|
| Relevance to AI trends | ⭐⭐⭐⭐⭐ |
| Data Engineering skills | ⭐⭐⭐⭐ |
| Portfolio standout factor | ⭐⭐⭐⭐⭐ |
| Open source contribution potential | ⭐⭐⭐⭐⭐ |
| Job market demand | ⭐⭐⭐⭐⭐ |

**Architecture**:
```
┌────────────────────────────────────────────────────────────────┐
│                     YOUR MCP + RAG PROJECT                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                               │
│  │ Document    │──┐                                            │
│  │ Sources     │  │                                            │
│  └─────────────┘  │    ┌─────────────┐    ┌─────────────┐     │
│                   ├───▶│ Ingestion   │───▶│ Vector DB   │     │
│  ┌─────────────┐  │    │ Pipeline    │    │ (Qdrant)    │     │
│  │ APIs        │──┘    │ (Airflow)   │    └─────────────┘     │
│  └─────────────┘       └─────────────┘           │             │
│                                                   │             │
│                                                   ▼             │
│  ┌─────────────┐       ┌─────────────┐    ┌─────────────┐     │
│  │ Claude Code │◀─────▶│ MCP Server  │◀──▶│ RAG Engine  │     │
│  │ (User)      │       │ (Your Code) │    │ (LangChain) │     │
│  └─────────────┘       └─────────────┘    └─────────────┘     │
│                               │                                 │
│                               ▼                                 │
│                        ┌─────────────┐                         │
│                        │ PostgreSQL  │                         │
│                        │ (Metadata)  │                         │
│                        └─────────────┘                         │
└────────────────────────────────────────────────────────────────┘
```

**MCP Server Features**:
```typescript
// Custom MCP tools
@tool("search_knowledge_base")
async searchKnowledge(query: string): Promise<string> {
  // Query RAG pipeline
}

@tool("ingest_document")
async ingestDocument(url: string): Promise<string> {
  // Trigger Airflow DAG to ingest new document
}

@tool("get_data_quality_report")
async getDataQuality(): Promise<string> {
  // Return data quality metrics
}
```

**Skills Demonstrated**:
- MCP protocol implementation
- Vector database management
- Data pipeline orchestration
- RAG architecture
- API development
- Docker + CI/CD

---

## Part 6: Learning Resources

### Courses (Free)
- [DataTalksClub Data Engineering Zoomcamp](https://github.com/DataTalksClub/data-engineering-zoomcamp)
- [DataTalksClub LLM Zoomcamp](https://github.com/DataTalksClub/llm-zoomcamp)
- [Anthropic's MCP Documentation](https://modelcontextprotocol.io/)

### GitHub Repos to Study
- [anthropics/claude-code](https://github.com/anthropics/claude-code)
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- [langchain-ai/langchain](https://github.com/langchain-ai/langchain)
- [run-llama/llama_index](https://github.com/run-llama/llama_index)

### Papers to Read
- "Voyager: An Open-Ended Embodied Agent" (Minecraft agent)
- "Reflexion: Language Agents with Verbal Reinforcement"
- "ToolLLM: Facilitating Large Language Models to Master Tools"

---

## Summary

### Recommended Path

1. **Week 1-2**: Learn MCP basics, build simple MCP server
2. **Week 3-4**: Set up vector database (Qdrant), implement basic RAG
3. **Week 5-6**: Add data ingestion pipeline (Airflow/Prefect)
4. **Week 7-8**: Integrate with Claude Code, test MCP tools
5. **Week 9-10**: Add monitoring, documentation, CI/CD
6. **Week 11-12**: Polish, write blog post, contribute to open source

### Key Differentiators

| What Others Do | What You Should Do |
|----------------|-------------------|
| Simple chatbot | MCP-enabled AI agent |
| Static RAG | Dynamic ingestion pipeline |
| Single model | Multi-agent orchestration |
| No monitoring | Full observability |
| README only | Architecture docs + blog |

---

## Unresolved Questions

1. Should you contribute to existing MCP servers or build new one? → **Build new one** (more impressive)
2. Claude vs OpenAI for agents? → **Claude** (better agentic capabilities, MCP ecosystem)
3. Vector DB choice? → **Qdrant** (open source, easy Docker setup, good Python SDK)
