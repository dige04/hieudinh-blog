# Research Report: Academic AI Agent Projects with Clear Benchmarks (2026)

**Date**: 2026-02-05
**Focus**: Projects có benchmark rõ ràng, publishable tại top venues

---

## Executive Summary

Năm 2026, các hướng nghiên cứu AI agents có benchmark rõ ràng nhất:

| Hướng | Benchmark | Publishability |
|-------|-----------|----------------|
| **Code Agents** | SWE-bench, HumanEval, LiveCodeBench | ⭐⭐⭐⭐⭐ |
| **Computer Use** | OSWorld, CUB, WebArena | ⭐⭐⭐⭐⭐ |
| **Multi-Agent** | AgentBench, GAIA | ⭐⭐⭐⭐ |
| **Agent Memory** | Custom benchmarks (research gap!) | ⭐⭐⭐⭐⭐ |
| **Agent Safety** | Red-teaming datasets | ⭐⭐⭐⭐ |

**Top Pick**: Cải tiến trên **SWE-bench** hoặc tạo benchmark mới cho **Agent Memory** - đây là research gaps lớn.

---

## Part 1: Major Benchmarks (2026)

### Code Generation & Software Engineering

| Benchmark | Mô tả | SOTA (2026) | Leaderboard |
|-----------|-------|-------------|-------------|
| **SWE-bench** | Resolve real GitHub issues | ~70% (Verified) | swebench.com |
| **SWE-bench Pro** | Multi-file, multi-language (Go, TS, JS, Python) | ~50% | swebench.com |
| **HumanEval** | Function completion từ docstring | ~95%+ | papers with code |
| **MBPP** | Mostly Basic Python Problems | ~90%+ | papers with code |
| **LiveCodeBench** | Contamination-free, updated regularly | varies | livecodebench.github.io |
| **BigCodeBench** | Complex coding tasks | varies | bigcode-bench.github.io |

### Computer Use & Web Agents

| Benchmark | Mô tả | SOTA (2026) | Notes |
|-----------|-------|-------------|-------|
| **OSWorld** | Real computer environment tasks | ~15% | Multimodal agents |
| **OSWorld-Verified** | Enhanced version (July 2025) | ~20% | More reliable |
| **WebArena** | Realistic web browsing tasks | ~30% | Natural language → web actions |
| **CUB** | End-to-end computer use | ~10% | Very challenging |

### General Agent Benchmarks

| Benchmark | Mô tả | Focus |
|-----------|-------|-------|
| **AgentBench** | Multi-environment agent testing | Diverse scenarios |
| **GAIA** | General AI Assistant benchmark | Tool use + web browsing |
| **MLR-Bench** | ML research automation | Scientific research agents |

---

## Part 2: Research Gaps (Publishable Opportunities)

### 🔴 HIGH IMPACT: Agent Memory

**Problem**: Current agents struggle with:
- Long-term memory retention
- Memory synchronization across sessions
- Catastrophic forgetting during updates
- Privacy/safety of stored memories

**Why It's a Gap**:
- Không có benchmark chuẩn cho agent memory
- Top labs (Anthropic, DeepMind) đang tích cực nghiên cứu
- Critical cho real-world deployment

**Project Idea**:
```
Build Agent Memory Benchmark:
├── Episodic memory tests (remember past interactions)
├── Semantic memory tests (retain knowledge)
├── Memory retrieval accuracy
├── Memory update consistency
└── Privacy/safety evaluation
```

**Publishability**: NeurIPS, ICML, ICLR - rất cao vì đây là gap lớn

---

### 🔴 HIGH IMPACT: Long-Context Reasoning

**Problem**:
- Dialog drift over long conversations
- Maintaining progress across context windows
- Processing large tool outputs

**Current State**:
- Gemini 3: 10M+ tokens context
- Claude 4: 500K tokens
- Nhưng hiệu quả sử dụng context vẫn thấp

**Project Idea**:
```
Build Long-Context Agent Benchmark:
├── Multi-session task completion
├── Context utilization efficiency
├── Coherence over 100+ turns
└── Recovery from context loss
```

**Publishability**: ACL, EMNLP, NeurIPS

---

### 🟡 MEDIUM IMPACT: Multi-Agent Collaboration

**Problem**:
- Orchestration complexity
- Memory synchronization between agents
- Conflict resolution
- Scaling to many agents

**Existing Work**: AgentBench covers some, but multi-agent specific benchmarks are lacking

**Project Idea**:
```
Multi-Agent Collaboration Benchmark:
├── Team task completion
├── Communication efficiency
├── Role specialization
├── Fault tolerance
└── Scalability tests
```

**Publishability**: ICML, NeurIPS, AAMAS

---

### 🟡 MEDIUM IMPACT: Agent Safety & Robustness

**Problem**:
- Unexpected behaviors in edge cases
- Data poisoning attacks
- Permission bypass
- Deceptive behaviors with memory

**Existing Work**: Red-teaming datasets exist, but agent-specific safety benchmarks are sparse

**Project Idea**:
```
Agent Safety Benchmark:
├── Adversarial robustness tests
├── Permission boundary tests
├── Deception detection
├── Data poisoning resistance
└── Alignment stability
```

**Publishability**: USENIX Security, NeurIPS Safety Track, ICML

---

## Part 3: Concrete Project Proposals (Academic Grade)

### Project 1: SWE-bench Extension for Data Engineering

**Concept**: Mở rộng SWE-bench cho data engineering tasks

```
SWE-bench-Data:
├── Pipeline bug fixes (Airflow, Prefect DAGs)
├── SQL optimization tasks
├── Schema migration issues
├── Data quality issues
└── ETL debugging
```

**Why Academic**:
- Clear benchmark metrics (pass/fail tests)
- Novel domain (không ai làm cho DE)
- Publishable: "SWE-bench-Data: Benchmarking LLM Agents on Data Engineering Tasks"

**Evaluation Metrics**:
- Task completion rate
- Code correctness (test pass)
- Efficiency (lines changed, time)

---

### Project 2: Agent Memory Benchmark

**Concept**: Benchmark đầu tiên cho agent memory systems

```
MemoryBench:
├── Retention Tests
│   ├── Short-term (within session)
│   ├── Medium-term (across sessions)
│   └── Long-term (weeks/months)
├── Retrieval Tests
│   ├── Accuracy
│   ├── Latency
│   └── Relevance ranking
├── Update Tests
│   ├── Consistency after updates
│   ├── Conflict resolution
│   └── Catastrophic forgetting
└── Safety Tests
    ├── Privacy preservation
    ├── Selective forgetting
    └── Deception detection
```

**Why Academic**:
- Fills major research gap
- Clear metrics for each dimension
- Publishable: "MemoryBench: A Comprehensive Benchmark for LLM Agent Memory Systems"

**Publication Target**: NeurIPS 2026, ICML 2026

---

### Project 3: LiveCodeBench Contributor

**Concept**: Contribute questions to LiveCodeBench

**How It Works**:
- LiveCodeBench releases new problems regularly
- Community can submit problems
- Your problems become part of standard evaluation

**Why Academic**:
- Direct contribution to major benchmark
- Co-authorship potential
- Visibility in the community

---

### Project 4: Multi-Language SWE-bench Agent

**Concept**: Build agent that performs well on SWE-bench Pro (multi-language)

```
Your Agent:
├── Language-agnostic code understanding
├── Cross-file dependency analysis
├── Multi-language tool integration
└── Unified testing framework
```

**Why Academic**:
- Clear benchmark (SWE-bench Pro leaderboard)
- Novel approach potential
- Publishable if you beat SOTA

**Current SOTA**: ~50% on SWE-bench Pro
**Target**: Beat by 5-10% = paper

---

### Project 5: OSWorld Agent Improvement

**Concept**: Improve multimodal computer use agents

**Current Challenge**: OSWorld SOTA is only ~20%

```
Improvement Areas:
├── Better visual understanding
├── More robust action execution
├── Error recovery
├── Task decomposition
└── Multi-step planning
```

**Why Academic**:
- Very clear benchmark (OSWorld leaderboard)
- Low SOTA = high improvement potential
- Hot topic (computer use agents)

**Publication Target**: CVPR, NeurIPS, ICML

---

## Part 4: Benchmark Comparison

### Difficulty vs Impact Matrix

```
                    HIGH IMPACT
                         │
    Agent Memory         │         SWE-bench Pro
    Benchmark (NEW)      │         Agent
         ⭐⭐⭐⭐⭐              │            ⭐⭐⭐⭐
                         │
    ─────────────────────┼─────────────────────
    HARD                 │                 EASY
                         │
    OSWorld              │         LiveCodeBench
    Agent                │         Contributor
       ⭐⭐⭐⭐                │            ⭐⭐⭐
                         │
                    LOW IMPACT
```

### Time Investment

| Project | Time | Benchmark | Publishability |
|---------|------|-----------|----------------|
| SWE-bench-Data (new benchmark) | 4-6 months | Create new | High |
| MemoryBench (new benchmark) | 4-6 months | Create new | Very High |
| SWE-bench Pro Agent | 3-4 months | Existing | Medium-High |
| OSWorld Agent | 3-4 months | Existing | Medium-High |
| LiveCodeBench Contributor | 1-2 months | Contribute | Low-Medium |

---

## Part 5: How to Get Started

### Option A: Beat Existing Benchmark

1. Pick benchmark: SWE-bench Pro hoặc OSWorld
2. Study current SOTA approaches
3. Identify weakness in current methods
4. Propose improvement
5. Implement and evaluate
6. Submit to leaderboard
7. Write paper if significant improvement

### Option B: Create New Benchmark

1. Identify gap (Agent Memory, Data Engineering)
2. Design task taxonomy
3. Collect/create evaluation data
4. Define metrics
5. Implement baseline agents
6. Release benchmark + paper
7. Build community around it

### Option C: Contribute to Existing

1. Join LiveCodeBench or SWE-bench community
2. Submit quality problems/issues
3. Help with evaluation infrastructure
4. Co-author potential

---

## Part 6: Top Recommendation

### 🏆 Best Choice: SWE-bench-Data (New Benchmark)

**Why This?**

| Factor | Score | Reason |
|--------|-------|--------|
| Novelty | ⭐⭐⭐⭐⭐ | No DE benchmark exists |
| Your Skills | ⭐⭐⭐⭐⭐ | You're learning Data Engineering |
| Publishability | ⭐⭐⭐⭐⭐ | Clear gap, clear metrics |
| Industry Relevance | ⭐⭐⭐⭐⭐ | Companies need DE agents |
| Feasibility | ⭐⭐⭐⭐ | Build on existing SWE-bench infra |

**Proposed Paper Title**:
> "SWE-bench-Data: Benchmarking Large Language Model Agents on Real-World Data Engineering Tasks"

**Core Contributions**:
1. First benchmark for DE agent evaluation
2. Curated dataset of real DE issues from GitHub
3. Baseline results with current SOTA agents
4. Analysis of failure modes specific to DE

**Task Categories**:
```
SWE-bench-Data Tasks:
├── Pipeline Issues
│   ├── Airflow DAG bugs
│   ├── Prefect flow errors
│   └── dbt model failures
├── SQL Issues
│   ├── Query optimization
│   ├── Schema migrations
│   └── Index issues
├── Data Quality
│   ├── Validation failures
│   ├── Schema drift
│   └── Data cleaning bugs
└── Infrastructure
    ├── Connection issues
    ├── Resource configuration
    └── Monitoring setup
```

**Data Sources**:
- Apache Airflow GitHub issues
- dbt-core GitHub issues
- Great Expectations issues
- Prefect issues
- Real company data pipelines (anonymized)

---

## Resources

### Papers to Read

1. **SWE-bench**: "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" (2024)
2. **SWE-agent**: "SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering" (2024)
3. **OSWorld**: "OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments" (2024)
4. **WebArena**: "WebArena: A Realistic Web Environment for Building Autonomous Agents" (2024)
5. **AgentBench**: "AgentBench: Evaluating LLMs as Agents" (2023)

### GitHub Repos

- [princeton-nlp/SWE-bench](https://github.com/princeton-nlp/SWE-bench)
- [princeton-nlp/SWE-agent](https://github.com/princeton-nlp/SWE-agent)
- [xlang-ai/OSWorld](https://github.com/xlang-ai/OSWorld)
- [web-arena-x/webarena](https://github.com/web-arena-x/webarena)

### Leaderboards

- [swebench.com](https://www.swebench.com/) - SWE-bench leaderboard
- [livecodebench.github.io](https://livecodebench.github.io/) - LiveCodeBench
- [paperswithcode.com](https://paperswithcode.com/sota) - All SOTA

---

## Summary

| Hướng | Benchmark | Độ khó | Impact | Recommendation |
|-------|-----------|--------|--------|----------------|
| **SWE-bench-Data** (NEW) | Create | Medium | Very High | 🏆 Top Pick |
| **MemoryBench** (NEW) | Create | Hard | Very High | 🥈 Second Pick |
| SWE-bench Pro Agent | Existing | Medium | High | Good if time-limited |
| OSWorld Agent | Existing | Hard | High | Good for CV/multimodal |
| LiveCodeBench Contrib | Existing | Easy | Medium | Good to start |

---

## Unresolved Questions

1. **Collaboration**: Có nên tìm lab/advisor không? → Có, giúp publication đáng kể
2. **Data Collection**: Làm sao collect enough real DE issues? → Scrape GitHub, partner với companies
3. **Compute**: Có cần GPU cluster không? → Có thể dùng free tier (Colab, GCP credits)
