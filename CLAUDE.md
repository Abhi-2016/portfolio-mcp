# [Project Name TBD] — Claude Instructions

## Project
A remote MCP server that exposes Abhishek's 5 AI portfolio projects (Circadia, AgileBot, research-synthesizer, Ghost-Cart, pdf-rag) as queryable tools, paired with a thin web chat frontend — so anyone can ask natural-language questions about the projects instead of reading 5 READMEs. See PLAN.md for full architecture and ground rules.

## User Learning Goal
The user is building toward a career as an Agentic AI PM. Target companies: Salesforce, IBM, Cohere. Dream companies: Anthropic, OpenAI. This project doubles as the practical MCP tutorial for that goal.

**Dual purpose (unique to this project):** unlike the other 5, this one has a second audience beyond the user's own learning — recruiters and other visitors will query it directly. Every decision is evaluated against two bars: does this teach the user something, and will this hold up and read credibly to a stranger interrogating it. Flag explicitly when those two goals pull in different directions.

Claude must:
- Actively teach and reinforce MCP concepts (tools, resources, transports, connectors) as we build
- Actively teach and reinforce Agentic AI and AI PM concepts at each step
- Call out what concept is being practised as we build
- Flag features or decisions that don't serve these learning goals
- Be honest and direct — not sycophantic. Push back when rationale is weak. Praise when thinking is genuinely strong, and explain why.

## Ground Rules
Full ground rules (14 total) live in PLAN.md. Key points:
- The user drives all decisions. Claude asks questions and guides — never assumes.
- Claude does not start coding without explaining the step and getting explicit approval.
- **Deployment requires explicit approval every time** (rule 14) — this is a public-facing service from day one, unlike the other 5 projects.
- Eval suite covers two layers: tool-level correctness and end-to-end conversational correctness (rule 5).
- Update PLAN.md, CLAUDE.md, and README.md after every commit.

## Architecture
See PLAN.md for the full content model, MCP tool list, and stack table. Summary:

| Layer | Choice |
|---|---|
| MCP server | Python + FastMCP, Streamable HTTP |
| Content | Parsed from the 5+ READMEs into structured JSON; refreshed automatically by an in-process background job (daily, GitHub API discovery) |
| Hosting | Railway |
| Web chat backend | Hand-rolled Claude tool-use loop (`tool_choice="auto"`) — chosen deliberately over the MCP connector for the learning reps |
| Access control | MCP server: fully open. Web chat backend: rate limited by IP + dynamic global daily cost ceiling |
| Project-name lookup | Fuzzy matching via embeddings (same infra as concept search), "no match" fallback if below threshold |

**Confirmed: 2-service architecture** — MCP server (refresh job included, internal-only) + web chat backend, same shape as Ghost-Cart's gateway/brain split.

## Open Questions (see PLAN.md for full detail)
1. ~~Concept taxonomy~~ — ✅ **Resolved.** Hybrid: ~20 canonical labels + embedding-based auto-assignment (reuses pdf-rag's sentence-transformers pattern), with raw fallback search for novel queries. Full decision + interview story in PLAN.md Decisions Log and README.md.
2. ~~`get_key_decisions` uneven coverage~~ — ✅ **Resolved.** Diagnosed as a content gap, not an architecture gap — all 5 repos now share an identical decision-table format directly, no parser normalization needed. Full writeup in PLAN.md Decisions Log and README.md.
3. ~~No freshness/versioning field~~ — ✅ **Resolved, together with #6.** In-process background refresh job inside the MCP server (GitHub API discovery + re-parse + re-embed), internal-only, no public tool. Full writeup in PLAN.md Decisions Log and README.md.
4. ~~No fuzzy-matching for project name lookups~~ — ✅ **Resolved.** Same embedding infra as #1, applied to project names/taglines instead of concept phrases. No match above threshold → "no matching project found," not a forced guess.
5. ~~Web chat backend cost exposure~~ — ✅ **Resolved.** Rate limiting by IP + a global daily cost ceiling (circuit breaker). Thresholds are dynamic config, tuned post-launch.
6. ~~Two-service architecture~~ — ✅ **Resolved, together with #3.** Confirmed: 2 services (MCP server with refresh built in, web chat backend).
7. ~~Hand-rolled loop vs. MCP connector~~ — ✅ **Resolved.** Hand-rolled, chosen deliberately for the learning reps over the connector's speed-to-ship — matches this project's premise. Full reasoning in PLAN.md Decisions Log and README.md.

**All 7 open questions from the 2026-08-03 architecture review are now resolved.** Next phase: implementation.

## Build Status
No code written yet. Currently in design phase — content schema, tools, and stack are agreed; project name not yet chosen.

## Source Projects (repo locations)
| Project | Path | Type |
|---|---|---|
| Circadia | `~/Documents/agentic-sleep-os/` | Learning project |
| AgileBot | `~/Documents/agilebot/` | Learning project |
| research-synthesizer | `~/Documents/research-synthesizer/` | Learning project |
| Ghost-Cart | `~/Documents/Ghost-Cart/` | Shipped product |
| pdf-rag | `~/Documents/pdf-rag/` | Shipped product |
