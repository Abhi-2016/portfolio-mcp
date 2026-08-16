# Throughline

> Ask about Abhishek's AI projects in plain English, instead of reading 5 READMEs. The name comes from what `search_concept` actually does — find the connective thread running across projects that never reference each other directly.

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

### `get_key_decisions` Coverage: Content Gap, Not an Architecture Gap

> *Answer to: "Tell me about a time you almost over-engineered a solution."*

**Setup**
Designing `get_key_decisions` — a tool meant to return "why did this project choose X over Y" for any of the 5 portfolio projects.

**The problem**
An architecture review found the 5 projects inconsistent in a way that looked like a system design problem: one project had a clean decision table, another's rationale lived in prose plus a separate mistakes log, a third had its reasoning structured under prose headers instead of a table, a fourth only had a tangential comparison framework, and a fifth had no dedicated decisions section at all.

**The diagnosis**
The instinct was to treat this like the concept-taxonomy decision above — write parsing logic to normalize whatever shape of content exists into one structure, possibly with LLM-assisted extraction from prose. But before building that, the actual question was what kind of problem this was. It wasn't a data-shape problem needing an engineering fix — it was a documentation gap. Some repos genuinely hadn't written this content down yet; others had it in a different but equally complete format; one just needed reformatting, not new content.

**The decision**
No parser, no normalization logic, no LLM extraction pipeline. The fix was writing the missing content directly and reformatting what already existed — all 5 repos now share an identical decision-table format. `get_key_decisions` does uniform extraction across all 5, nothing more.

**PM reflection**
Not every inconsistency needs an engineering solution. Before reaching for a parser or normalization layer, it's worth checking whether the "inconsistency" is a real data-shape problem or just unfinished content in disguise. Automating around a content gap doesn't close it — it hides it.

### Freshness & Service Count: In-Process Background Refresh, Not a Third Service

> *Answer to: "Tell me about a time a new requirement almost added unnecessary infrastructure."*

**Setup**
Two open questions turned out to be coupled: how does content freshness get maintained (including discovering brand-new projects, not just updates to known ones), and how many services does this system actually need.

**The problem**
The natural first instinct for freshness was "add a cron job." But a cron job is typically its own deployable — which raises a second problem: how does its output reach the service that actually answers queries? That requires shared storage between two independently deployed services, just to move a small dataset on a schedule.

**The diagnosis**
Separated two different kinds of components that had gotten conflated: services that answer live queries vs. jobs that run on a schedule and update data. Only the first kind changes the service count. Freshness is a batch-update concern, not a live-query concern — it doesn't need to be a service at all.

**The decision**
The refresh logic — discovering all repos via the GitHub API rather than a hardcoded list, re-parsing, re-embedding new content into the concept taxonomy above — runs as an in-process background task inside the MCP server itself, on a daily schedule. It updates the server's own dataset directly, no shared storage needed. The refresh capability is also entirely internal — no public tool exposes it, protecting the lean 5-tool surface from the token-cost lesson above. External users never trigger or see a refresh; they just get an answer that already reflects whatever the last cycle picked up. Final shape: 2 services, not 3.

**PM reflection**
A new requirement doesn't automatically need a new architectural tier. Before adding a service, check whether the new capability is a live-query concern or a batch-update concern — conflating the two is how systems accumulate services that don't need to exist.

### Web Chat Backend Loop: Hand-Rolled, Not the MCP Connector

> *Answer to: "Tell me about a time you chose the harder technical path on purpose."*

**Setup**
The web chat backend needs something that takes a visitor's plain-English question, decides which MCP tool(s) answer it, calls them, and turns the result into prose. Two ways to build that: hand-roll the tool-calling loop as code, or use Claude's managed MCP connector (beta), where Anthropic's own API infrastructure runs that loop internally and just returns a finished answer.

**The problem**
The connector ships faster — it's a config value instead of a loop to write, test, and debug. But it's also a black box: the tool-selection and dispatch logic happens inside Anthropic's infrastructure, invisible to anyone reading the code later.

**The decision**
Hand-rolled, deliberately. This project's entire premise is learning MCP by building it, not by configuring a managed feature around it — and the hand-rolled loop is the same pattern already proven twice in this portfolio (Ghost-Cart's Restock/Nudge agents, research-synthesizer's ReAct loop), so it's reinforcement of a real skill, not new unproven ground. The managed connector would ship the feature faster, but there'd be nothing to point to as "I built this" — the interesting engineering here would belong to Anthropic's infrastructure, not this project.

**Why this wasn't the "efficient" choice**
For a team optimizing purely for time-to-ship, the connector is the better call — less code, less to maintain, less that can break. This project chose more work on purpose because the work itself is the point.

**PM reflection**
Speed-to-ship and learning value aren't always the same axis, and a real product decision sometimes means picking the slower option deliberately — as long as that tradeoff is named explicitly, not stumbled into.

---

## Roadmap

- [x] Resolve open design questions (7 of 7 resolved — see Decisions & Interview Stories above)
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
