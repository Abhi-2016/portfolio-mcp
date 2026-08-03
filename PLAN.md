# [Project Name TBD] — Project Plan

## App Overview
A remote MCP server that exposes Abhishek's 5 AI portfolio projects (Circadia, AgileBot, research-synthesizer, Ghost-Cart, pdf-rag) as queryable tools, paired with a thin web chat frontend — so anyone can ask natural-language questions about the projects instead of reading 5 READMEs.

## Ground Rules

1. The plan file, CLAUDE.md, and README.md are updated after every commit to reflect what has been achieved.
2. All system prompts are written by the user and reviewed by Claude.
3. Every feature is built on its own branch and merged into main when complete.
4. The user is in the driver's seat. Claude asks questions and guides — the user makes decisions.
5. A robust eval suite is built alongside the product, covering two layers: (a) tool-level correctness — do `search_concept` and the other MCP tools return accurate, complete cross-project results; and (b) end-to-end conversational correctness — does the hand-rolled tool-use loop in the web chat backend answer real visitor questions correctly, grounded in the underlying data, without hallucinating. The user makes eval decisions; Claude reviews and guides.
6. Claude does not start coding without explaining the step and receiving explicit approval.
7. These ground rules are followed without deviation.
8. Any proposed changes to the plan must be presented to the user with a rationale, and require approval before taking effect.
9. **Learning goal:** The user's aim is to become an Agentic AI PM, targeting organisations like Salesforce, IBM, and Cohere, with dream roles at Anthropic and OpenAI. Claude must actively ensure the user is learning and applying both foundational and advanced Agentic AI concepts, as well as AI PM concepts. Claude will flag any features or decisions that don't serve these learning goals, and proactively call out what concept is being practised at each step.
   **Dual purpose:** unlike the other 5 portfolio projects, this one has a second audience beyond the user's own learning — recruiters and other visitors will query it directly, and its content is sourced from the other projects' own honesty about mistakes made. Decisions here are evaluated against both bars: does this teach the user something, and will this hold up and read credibly to a stranger interrogating it. Claude will flag explicitly when those two goals pull in different directions rather than silently picking one.
10. **Learn before build:** Claude explains the concept being practised before any code is written. The user must understand the why before seeing the how.
11. **Guided discovery:** For PM exercises (metrics, evals, specs, etc.), Claude leads with questions and the user provides the answers. Claude does not generate the output — it guides the user to build it themselves. Claude only drafts or codes once the user's thinking is captured and approved.
12. **No leading on PM artefacts:** Claude never presents a finished metrics framework, eval suite, PRD, or similar artefact unprompted. It asks questions, reflects answers back, and seeks explicit approval at each step before moving forward.
13. **Honest, unbiased feedback:** Claude gives fair, grounded, and direct feedback — not sycophantic approval. Claude pushes back when something is wrong, underdeveloped, or worth challenging. Claude also calls out genuinely strong product instincts and decisions when they deserve it. The goal is to accelerate learning, not to make the user feel good.
14. **Deployment requires explicit approval.** This project is a public-facing service from day one — unlike the other 5 portfolio projects, which are dev-only or already-deployed by the time their ground rules were written. Nothing is pushed to the live Railway URL (or any other public endpoint) without the user explicitly saying go. This is separate from and in addition to rule 8 — a deploy is an action, not a plan change, and needs its own confirmation every time, not just the first time.

---

## Architecture

### Content Model
One unified schema across all 5 source projects (Circadia, AgileBot, research-synthesizer, Ghost-Cart, pdf-rag) — confirmed uniform after all 5 READMEs were checked for `Concepts Practised` and `Wrong Calls`/`Lessons Learned` sections.

```
Project {
  name, tagline, status, tech_stack, repo_url
  architecture: { overview, key_decisions[] }        // decision, why, alternative rejected
  concepts_practiced: { category → [{concept, where_practiced}] }
  reflections: [{ call, why_wrong, correction, tag }]
  interview_story?: string                            // optional — research-synthesizer only, for now
}
```

### MCP Tools
Kept deliberately small — research-synthesizer's own Week 5 finding (3 tools ≈ 1,071 tokens vs. 27 tools ≈ 4,134 tokens) is the reason this server exposes 5 generic, parameterized tools rather than one per project per section.

| Tool | Input | Returns |
|---|---|---|
| `list_projects` | — | name, tagline, status, stack for all 5 |
| `get_project_overview` | project name | purpose, architecture, tech stack, status |
| `get_key_decisions` | project name | "why we chose X over Y" decision table |
| `get_learning_log` | project name | concepts practiced + reflections together |
| `search_concept` | concept, e.g. "evals" | cross-project — every project that touched this concept |

### Stack

| Layer | Choice | Rationale |
|---|---|---|
| MCP server | Python + FastMCP | Reuses existing Python fluency (pdf-rag, research-synthesizer, AgileBot, Ghost-Cart's `brain`) — no new language |
| Transport | Streamable HTTP | Current standard for remote MCP servers (replaces SSE-only) |
| Content ingestion | One-time parser script → structured JSON from the 5 READMEs | Avoids fragile live markdown parsing on every query; re-run script when a README changes |
| Hosting | Railway | One-click FastMCP deploy template exists; reuses account/deployment experience from Ghost-Cart |
| Web chat backend | Hand-rolled Claude tool-use loop (`tool_choice="auto"`) — **flagged for reconsideration, see open questions below** | Was chosen to reuse the agentic-loop pattern already built in Ghost-Cart's Restock/Nudge agents and research-synthesizer's ReAct loop, rather than the managed MCP connector (beta) |
| Access control | Fully open, no auth | Content isn't sensitive; simplest to ship |

### Open Questions
Surfaced during architecture review on 2026-08-03. None of these are resolved yet — listed in the order we plan to work through them.

1. **Concept taxonomy** — do we extract tags from what each project already wrote (categories and wording differ across all 5 — e.g. Ghost-Cart has 3 categories, pdf-rag has 5, Circadia has 2), or define a fixed vocabulary up front so `search_concept` matches consistently? This is the most important open item — it's the tool that makes the whole server worth building. **Next up.**
2. **`get_key_decisions` uneven coverage** — Ghost-Cart and AgileBot have clean "why X over Y" tables; Circadia's reasoning is scattered across prose and its Wrong Calls table; pdf-rag has a comparison table, not a decisions table. Decide whether the parser normalizes/synthesizes a decisions table for projects that don't have one verbatim, or whether uneven depth per project is acceptable.
3. **No freshness/versioning field in the schema** — nothing captures when a project was last parsed, so served content can silently drift from the live README.
4. **No fuzzy-matching or error handling for project name lookups** — tool inputs are LLM-generated, not a dropdown; a typo or paraphrase ("the sleep app" instead of "Circadia") isn't designed for yet.
5. **Web chat backend cost exposure** — the "fully open, no auth" access decision was made for the MCP server broadly, but the MCP server itself just serves static JSON (cheap). The web chat backend calls the Claude API on every message (not cheap, unbounded if scraped or abused). These are two different risk surfaces and only one was actually assessed as low-risk.
6. **Two-service architecture not yet explicitly confirmed** — the MCP server (FastMCP, tools) and the web chat backend (Claude API + loop + frontend) are separate deployables, same shape as Ghost-Cart's gateway/brain split. Needs explicit confirmation before Railway setup, since it means two services to deploy and wire together.
7. **Web chat backend loop approach** — hand-rolled tool-use loop vs. Claude's managed MCP connector (beta). Provisionally hand-rolled, but the user has reservations to work through before this is final.

---

## Progress Log
| Date | Milestone |
|---|---|
| 2026-08-03 | Project initiated. Content schema, 5 MCP tools, and stack (Python/FastMCP/Streamable HTTP/Railway) designed and agreed. Ground rules imported from Circadia and adapted: eval scope widened to tool + conversational layers (rule 5), dual-purpose framing added (rule 9), deployment-approval rule added (rule 14). Architecture reviewed — 7 open items surfaced, concept taxonomy identified as highest priority. Project name not yet chosen. |
