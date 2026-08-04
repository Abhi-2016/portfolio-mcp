# [Project Name TBD]

> Ask about Abhishek's AI projects in plain English, instead of reading 5 READMEs.

**Status: design phase — no code written yet.** This README documents the plan as agreed so far; it will be updated as the build progresses.

---

## What This Is

A remote MCP (Model Context Protocol) server that exposes 5 AI portfolio projects — [Circadia](https://github.com/Abhi-2016), AgileBot, research-synthesizer, [Ghost-Cart](https://github.com/Abhi-2016/ghost-cart), and [pdf-rag](https://github.com/Abhi-2016/pdf-rag) — as queryable tools, paired with a web chat page. Ask a question like *"what's Abhishek's experience with multi-agent architectures?"* and get an answer synthesized across whichever of the 5 projects are actually relevant — something no single README can do.

Built as a practical MCP tutorial: the product it produces is the portfolio artifact, and building it is how MCP gets learned hands-on.

---

## Two Ways to Use It

| Audience | How |
|---|---|
| Engineers / AI builders with their own MCP client | Point Claude Desktop or Cursor at the hosted server URL and query it directly |
| Everyone else (recruiters, PMs) | Visit the web chat page and type a question — no MCP knowledge required |

---

## Architecture (planned)

```
Technical visitor                    Everyone else
  (own MCP client)                   (browser)
        │                                │
        │ connects directly              │ types a question
        ▼                                ▼
┌─────────────────┐            ┌──────────────────────┐
│   MCP Server      │◄──────────│  Web Chat Backend      │
│   (FastMCP,        │  tool     │  Claude API +          │
│   Streamable HTTP)  │  calls    │  tool-use loop         │
└─────────────────┘            └──────────────────────┘
        │
        ▼
  Structured project data
  (parsed once from the 5
   source READMEs)
```

Two separate deployables — same shape as Ghost-Cart's gateway/brain split.

---

## Tech Stack (planned)

| Layer | Choice |
|---|---|
| MCP server | Python + FastMCP |
| Transport | Streamable HTTP |
| Content | Parsed once from the 5 project READMEs into structured JSON |
| Hosting | Railway |
| Web chat backend | Claude API + tool-use loop (approach still under review) |

---

## MCP Tools (planned)

| Tool | What it does |
|---|---|
| `list_projects` | Returns name, tagline, status, stack for all 5 projects |
| `get_project_overview` | Purpose, architecture, tech stack, status for one project |
| `get_key_decisions` | "Why we chose X over Y" decisions for one project |
| `get_learning_log` | Concepts practiced + wrong calls/lessons learned for one project |
| `search_concept` | Cross-project search — every project that touched a given concept |

Kept deliberately small: research-synthesizer's own token-cost finding (3 tools ≈ 1,071 tokens vs. 27 tools ≈ 4,134 tokens) is why this server has 5 generic tools instead of one per project per section.

---

## Decisions & Interview Stories

### Concept Taxonomy: Hybrid (canonical buckets + embedding matching)

> *Answer to: "Tell me about a tradeoff you had to reason through on an AI feature."*

**Setup**
Designing `search_concept` for this server — ask "what's your experience with evals?" and get an answer synthesized across every project that touched it, not just one README. That only works if "evals" reliably matches however each project actually phrased it — "Eval Suite," "LLM-as-judge," "Evaluator rubric design" — which don't share exact wording.

**The problem**
Two options on the table. A fixed vocabulary — define canonical concepts, map every phrase to one — gives deterministic, explainable matches. But before picking it, the actual scope got counted first: roughly 110 distinct concept entries across the 5 source projects. That's not a design decision at that scale, that's a data-entry project, and it doesn't scale — every new project or README edit adds more unmapped phrases. The alternative, embedding-based similarity search, scales automatically and needs zero manual mapping — but loses the enumerable, explainable vocabulary. No clean way to list "here's what I can answer questions about" from raw embeddings, and every match becomes a similarity score instead of a rule you can point to.

**The decision**
Rather than pick a side, the two options' weaknesses turned out to be complementary, not competing — Option A's cost was manual labor, Option B's cost was no enumerable output. So: keep ~20 canonical concept labels for display and determinism, but use embeddings to auto-assign the ~110 source phrases into those buckets instead of sorting them by hand — cutting the manual work from "decide 110 placements" to "review the ~15 the embedding model got wrong." Queries that clearly match a canonical bucket resolve deterministically; anything novel falls back to raw embedding search so it's never a hard miss.

**Why this wasn't free**
Hybrid wasn't treated as a strictly-better answer. It's more code than either pure option — two resolution paths to build and evaluate instead of one — and it still carries the embedding infrastructure cost that the pure fixed-vocabulary option would have avoided entirely. Chosen because determinism-where-possible plus coverage-where-not was worth that added surface area; that's a call, not a free lunch.

**PM reflection**
When two options have complementary failure modes, the question isn't "which one do I pick" — it's whether combining them costs less than the failure mode you're avoiding. Here it did, mostly because the embedding infrastructure was already built and understood from a prior project ([pdf-rag](https://github.com/Abhi-2016/pdf-rag)), which is what made the hybrid's added cost small enough to be worth it.

---

## Roadmap

- [ ] Resolve open design questions (concept taxonomy, two-service confirmation, web chat loop approach)
- [ ] Choose project name
- [ ] Build content parser (5 READMEs → structured JSON)
- [ ] Build MCP server + tools
- [ ] Build web chat backend + frontend
- [ ] Deploy to Railway
- [ ] Eval suite: tool-level + end-to-end conversational

---

## Source Projects

| Project | Type |
|---|---|
| Circadia | Agentic AI sleep app — learning project |
| AgileBot | Agentic AI scrum master — learning project |
| research-synthesizer | Multi-agent research + eval framework — learning project |
| Ghost-Cart | Location-aware grocery agent — shipped product |
| pdf-rag | Claude-native RAG system — shipped product |
