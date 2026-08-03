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
