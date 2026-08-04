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
| Content | Parsed once from the 5 READMEs into structured JSON |
| Hosting | Railway |
| Web chat backend | Under review — hand-rolled tool-use loop vs. Claude's MCP connector |
| Access control | MCP server: fully open. Web chat backend cost exposure: unresolved (see Open Questions) |

**This is a two-service architecture** (MCP server + web chat backend), same shape as Ghost-Cart's gateway/brain split — pending explicit confirmation (see PLAN.md Open Questions #6).

## Open Questions (see PLAN.md for full detail)
1. ~~Concept taxonomy~~ — ✅ **Resolved.** Hybrid: ~20 canonical labels + embedding-based auto-assignment (reuses pdf-rag's sentence-transformers pattern), with raw fallback search for novel queries. Full decision + interview story in PLAN.md Decisions Log and README.md.
2. `get_key_decisions` uneven coverage across the 5 source projects (**next up**)
3. No freshness/versioning field in the schema
4. No fuzzy-matching for project name lookups — note: #1's embedding infra likely solves this too, same mechanism, different corpus (5 project names vs. ~110 concept phrases)
5. Web chat backend cost exposure (separate risk from MCP server access)
6. Two-service architecture — needs explicit confirmation
7. Hand-rolled loop vs. MCP connector — user has reservations, not yet resolved

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
