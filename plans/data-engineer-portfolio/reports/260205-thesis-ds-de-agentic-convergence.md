# Báo Cáo Nghiên Cứu Chiến Lược: Sự Hội Tụ Của Data Science Và Data Engineering Trong Kỷ Nguyên Agentic Coding (2025-2026)

**Ngày tạo**: 2026-02-05
**Loại**: Thesis Research Proposal
**Nguồn**: User-provided research + AI synthesis

---

## Executive Summary

Báo cáo này phân tích sự hội tụ giữa Data Science và Data Engineering trong kỷ nguyên SE 3.0 (Agentic Software Engineering), tập trung vào:

1. **SE 3.0 Evolution**: Từ coding thủ công → AI copilots → AI agents tự chủ
2. **Multi-Agent Architectures**: CleanAgent, AutoTQA, FlowETL
3. **Self-Healing Pipelines**: Agentic Control Plane
4. **Agentic Text-to-SQL**: SQL-Trail với RL
5. **Benchmarks**: ELT-Bench (3.9% SOTA), BIRD-SQL, SWE-bench
6. **3 Thesis Proposals**: Multi-Agent RL, Human-in-Loop Cleaning, Semantic Lineage

---

## 1. Giới Thiệu: SE 3.0 và Data Agents

### 1.1. Evolution of Software Engineering

| Era | Đặc điểm | Vai trò AI |
|-----|----------|------------|
| **SE 1.0** | Mã hóa thủ công | Không có |
| **SE 2.0** | AI Copilots | Gợi ý thụ động |
| **SE 3.0** | AI Agents | Tự chủ, goal-oriented |

### 1.2. Data Agent Classification

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Data Preparation Agents** | Làm sạch, chuẩn hóa | CleanAgent, FlowETL |
| **Analysis & Querying Agents** | Text-to-SQL, EDA | AutoTQA, SQL-Trail |
| **Ops & Self-Healing Agents** | Giám sát, tự vá | Emerging 2025-2026 |

### 1.3. Research Gap

- **ELT-Bench SOTA**: Chỉ 3.9% success rate
- **Cơ hội**: Cải thiện lên 10-15% = đóng góp học thuật lớn

---

## 2. Kiến Trúc Đa Tác Nhân (Multi-Agent Systems)

### 2.1. CleanAgent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLEANAGENT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Column-type Annotator                                       │
│     └── Semantic data type detection                            │
│                          ▼                                      │
│  2. Python Programmer                                           │
│     └── Code generation with Dataprep.Clean                    │
│                          ▼                                      │
│  3. Code Executor                                               │
│     └── Sandbox + Self-Correction loop                         │
│                          ▼                                      │
│  4. Chat Manager                                                │
│     └── Orchestration                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. AutoTQA: Planner-Critic Model

```
User Query → PLANNER → EXECUTOR → CRITIC → Accept/Reject
                                     ↓
                              Replanning (if rejected)
```

### 2.3. FlowETL: Programming by Example

- **Input**: (Source file, Target file) pair
- **LLM**: Infers transformation logic
- **Challenge**: Scalability với complex transformations
- **Opportunity**: RL để tối ưu search space

---

## 3. Self-Healing Data Pipelines

### 3.1. Agentic Control Plane

```
DETECTION → ROOT CAUSE ANALYSIS → AUTOMATED REMEDIATION → ROLLBACK
    │              │                      │                  │
  Logs         Git commits            Knowledge base      Safe state
  Telemetry    Schema changes         Patch generation
               Data volume shifts     Sandbox testing
```

### 3.2. Semantic Data Lineage

- **Problem**: Static parsers miss column-level lineage
- **Solution**: LLM-based Semantic Lineage Parsing
- **Benefit**: Automatic downstream impact analysis

---

## 4. Agentic Data Science

### 4.1. SQL-Trail: Multi-Turn Text-to-SQL

```
Exploratory Queries → Main Query → Error Handling → Result
       │                              │
   Probe schema              Self-repair with
   Check values              error feedback
```

### 4.2. RL Integration

| Component | Description |
|-----------|-------------|
| Adaptive Turn-Budget | Simple → few steps; Complex → more steps |
| Composite Reward | Correctness + Efficiency |
| Anti-Overthinking | Penalize excessive reasoning |

---

## 5. Benchmarks

| Benchmark | Focus | SOTA | Gap |
|-----------|-------|------|-----|
| **ELT-Bench** | End-to-end ELT pipelines | 3.9% | HUGE |
| **BIRD-SQL** | Dirty data Text-to-SQL | ~70% | Medium |
| **SWE-bench** | GitHub issue resolution | ~70% | Medium |
| **OSWorld** | Computer use | ~20% | Large |

---

## 6. Thesis Proposals

### Proposal 1: Multi-Agent RL for ELT Optimization

**Problem**: 3.9% success rate on ELT-Bench

**Solution**:
```
Architect Agent → Coder Agent → Debugger Agent (RL-trained)
      │               │               │
   DAG design    SQL/dbt code    Error learning
```

**Benchmark**: ELT-Bench
**Target**: 10-15% accuracy
**Venue**: NeurIPS, ICML

### Proposal 2: Interactive Data Cleaning with Human-in-Loop

**Problem**: Autonomous agents fail with semantic/domain errors

**Solution**: Chain-of-Thought with Human Feedback
- Agent asks questions at decision points
- Minimal human intervention = exponential accuracy improvement

**Benchmark**: CleanAgent dataset or custom dirty data
**Venue**: CHI, CSCW, NeurIPS

### Proposal 3: Semantic Lineage Recovery with LLM Agents

**Problem**: Static lineage breaks with rapid CI/CD

**Solution**: "Graph Guardian" Agent
- Analyzes git diffs
- Auto-updates OpenLineage graph
- No full reparse needed

**Benchmark**: SWE-bench (data tasks) or custom schema evolution
**Venue**: SIGMOD, VLDB, NeurIPS

---

## 7. Recommendation

### Best Thesis Direction: Proposal 1 (Multi-Agent RL for ELT)

| Factor | Score | Reason |
|--------|-------|--------|
| Novelty | ⭐⭐⭐⭐⭐ | RL + Multi-Agent + Data Engineering |
| Clear Benchmark | ⭐⭐⭐⭐⭐ | ELT-Bench with 3.9% baseline |
| Industry Relevance | ⭐⭐⭐⭐⭐ | Every company needs data pipelines |
| Publishability | ⭐⭐⭐⭐⭐ | Clear metrics, SOTA gap |
| Feasibility | ⭐⭐⭐⭐ | Requires RL expertise |

### Alternative: Create New Benchmark

If building agents is too complex, consider:
- **SWE-bench-Data**: First benchmark for Data Engineering agents
- Collect dbt/Airflow GitHub issues
- Define pass/fail metrics
- Publish benchmark paper

---

## 8. Key References

### Architectures
- CleanAgent (2025) - Multi-agent data cleaning
- AutoTQA (2025) - Planner-Critic for tabular QA
- FlowETL (2025) - Programming by Example
- SQL-Trail (2025) - RL-based Text-to-SQL

### Benchmarks
- ELT-Bench (UIUC 2025) - End-to-end ELT evaluation
- BIRD-SQL - Real-world dirty data
- SWE-bench - Software engineering tasks

### Frameworks
- SASE (Queen's University) - Structured Agentic SE
- OpenLineage - Data lineage standard

---

## 9. Next Steps

1. **Literature Review**: Deep dive vào CleanAgent, SQL-Trail papers
2. **Benchmark Setup**: Download ELT-Bench, run baseline experiments
3. **Architecture Design**: Multi-Agent RL framework
4. **Advisor Discussion**: Validate direction with supervisor
5. **Proposal Writing**: Formal thesis proposal

---

*Report synthesized from user-provided research and AI analysis on 2026-02-05*
