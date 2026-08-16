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
| Content ingestion | Parser → structured JSON, re-run automatically by an in-process background job inside the MCP server (daily) | Avoids fragile live markdown parsing on every query; refresh job also discovers new repos via the GitHub API rather than a hardcoded list of 5 — see Decision #3 |
| Hosting | Railway | One-click FastMCP deploy template exists; reuses account/deployment experience from Ghost-Cart |
| Service count | 2 — MCP server (refresh job included) + web chat backend | Confirmed in Decision #3 — the refresh job is a batch-update concern, not a live-query concern, so it doesn't need to be a third service |
| Web chat backend | Hand-rolled Claude tool-use loop (`tool_choice="auto"`) — **flagged for reconsideration, see open questions below** | Was chosen to reuse the agentic-loop pattern already built in Ghost-Cart's Restock/Nudge agents and research-synthesizer's ReAct loop, rather than the managed MCP connector (beta) |
| Access control | Fully open, no auth | Content isn't sensitive; simplest to ship |

### Open Questions
Surfaced during architecture review on 2026-08-03. Listed in the order we planned to work through them.

1. ~~**Concept taxonomy**~~ — ✅ **Resolved 2026-08-03.** Hybrid approach: ~20 canonical concept labels for enumerability/determinism, with embedding-based cosine similarity (reusing pdf-rag's sentence-transformers pattern) auto-assigning the ~110 source phrases into those labels instead of manual mapping. Queries that match a canonical label resolve deterministically; novel queries fall back to raw phrase-level embedding search. Full reasoning in the Decisions Log below.
2. ~~**`get_key_decisions` uneven coverage**~~ — ✅ **Resolved 2026-08-03.** Turned out not to be an engineering problem — see Decisions Log below. All 5 source repos now share an identical decision-table format (`Decision | What | Why`); `get_key_decisions` needs uniform extraction only, no normalization logic.
3. ~~**No freshness/versioning field in the schema**~~ — ✅ **Resolved 2026-08-03, together with #6.** In-process background refresh job inside the MCP server, no third service. Full reasoning in Decisions Log.
4. ~~**No fuzzy-matching or error handling for project name lookups**~~ — ✅ **Resolved 2026-08-03.** Reuses the Decision #1 embedding infrastructure against a different corpus (project names/taglines instead of concept phrases). Cosine-match the input against known project names; below-threshold queries return "no matching project found" rather than force-matching to the closest-but-wrong project.
5. ~~**Web chat backend cost exposure**~~ — ✅ **Resolved 2026-08-03.** Rate limiting by IP plus a global daily cost ceiling as a circuit breaker (friendly "check back tomorrow" message, not a silent failure or unbounded spend). Thresholds left as dynamic config, to be tuned once real traffic is visible post-launch.
6. ~~**Two-service architecture not yet explicitly confirmed**~~ — ✅ **Resolved 2026-08-03, together with #3.** Confirmed: 2 services (MCP server, web chat backend). The refresh job from #3 lives inside the MCP server as a background task, not a third service. Full reasoning in Decisions Log.
7. ~~**Web chat backend loop approach**~~ — ✅ **Resolved 2026-08-03.** Hand-rolled tool-use loop, chosen deliberately over Claude's managed MCP connector for the learning reps — consistent with this project's whole premise. Full reasoning in Decisions Log.

All 7 open questions from the 2026-08-03 architecture review are now resolved.

---

## Decisions Log

### Decision #1 — Concept Taxonomy: Hybrid (canonical buckets + embedding matching)
**Resolved:** 2026-08-03

> *Answer to: "Tell me about a tradeoff you had to reason through on an AI feature."*

**Setup**
Designing `search_concept` for the MCP server — ask "what's your experience with evals?" and get an answer synthesized across every project that touched it, not just one README. That only works if "evals" reliably matches however each project actually phrased it — "Eval Suite," "LLM-as-judge," "Evaluator rubric design" — which don't share exact wording.

**The problem**
Two options on the table. A fixed vocabulary — define canonical concepts, map every phrase to one — gives deterministic, explainable matches. But before picking it, the actual scope got counted first: roughly 110 distinct concept entries across 5 repos. That's not a design decision at that scale, that's a data-entry project, and it doesn't scale — every new project or README edit adds more unmapped phrases. The alternative, embedding-based similarity search, scales automatically and needs zero manual mapping — but loses the enumerable, explainable vocabulary. No clean way to list "here's what I can answer questions about" from raw embeddings, and every match becomes a similarity score instead of a rule you can point to.

**The decision**
Rather than pick a side, the two options' weaknesses turned out to be complementary, not competing — Option A's cost was manual labor, Option B's cost was no enumerable output. So: keep ~20 canonical concept labels for display and determinism, but use embeddings to auto-assign the 110 source phrases into those buckets instead of sorting them by hand — cutting the manual work from "decide 110 placements" to "review the ~15 the embedding model got wrong." Queries that clearly match a canonical bucket resolve deterministically; anything novel falls back to raw embedding search so it's never a hard miss.

**Why this wasn't free**
Hybrid wasn't treated as a strictly-better answer. It's more code than either pure option — two resolution paths to build and evaluate instead of one — and it still carries the embedding infrastructure cost that the pure fixed-vocabulary option would have avoided entirely. Chosen because determinism-where-possible plus coverage-where-not was worth that added surface area; that's a call, not a free lunch.

**PM reflection**
When two options have complementary failure modes, the question isn't "which one do I pick" — it's whether combining them costs less than the failure mode you're avoiding. Here it did, mostly because the embedding infrastructure was already built and understood from a prior project (pdf-rag), which is what made the hybrid's added cost small enough to be worth it.

**Follow-up hooks:**
- *"Why not just use the fixed vocabulary from the start?"* → Sized the manual-mapping cost first (110 phrases) — it doesn't scale, and the embedding pattern was already built and understood from pdf-rag, so automating the mapping was close to free.
- *"How do you know the auto-assigned buckets are actually correct?"* → Open item — this decision hasn't been eval'd yet, only designed. Next step is defining what "correct bucket assignment" means well enough to test it.

### Decision #2 — `get_key_decisions` Coverage: Content Gap, Not an Architecture Gap
**Resolved:** 2026-08-03

> *Answer to: "Tell me about a time you almost over-engineered a solution."*

**Setup**
Designing `get_key_decisions` — a tool meant to return "why did this project choose X over Y" for any of the 5 portfolio projects.

**The problem**
An architecture review found the 5 projects inconsistent in a way that looked like a system design problem: AgileBot had a clean decision table, Ghost-Cart's rationale lived in prose plus a separate Wrong Calls table, research-synthesizer's reasoning was structured under prose headers instead of a table, pdf-rag only had a tangential comparison framework, and Circadia had no dedicated decisions section at all.

**The diagnosis**
The instinct was to treat this like Decision #1 — write parsing logic to normalize whatever shape of content exists into one structure, possibly with LLM-assisted extraction from prose. But before building that, the actual question was what kind of problem this was. It wasn't a data-shape problem needing an engineering fix — it was a documentation gap. Two of the five repos genuinely hadn't written this content down yet (Circadia, pdf-rag); one had it in a different but equally complete format (Ghost-Cart); one just needed reformatting, not new content (research-synthesizer).

**The decision**
No parser, no normalization logic, no LLM extraction pipeline. The fix was writing the missing content directly and reformatting what already existed — all 5 repos now share the identical `Decision | What | Why` table. `get_key_decisions` does uniform extraction across all 5, nothing more.

**Why this was a PM call, not just an engineering one**
This project's ground rules (mirrored from every other project here) say reasoning gets written by the person who made the decision, not generated by Claude, even in draft form — the same authenticity line came up designing Decision #1. Building an extraction pipeline to paper over missing content in a portfolio meant to represent someone's own thinking would have hidden the gap instead of closing it. Recognizing that this was a content problem wearing a data-shape costume, not an architecture problem, was the actual work.

**PM reflection**
Not every inconsistency needs an engineering solution. Before reaching for a parser or normalization layer, it's worth checking whether the "inconsistency" is a real data-shape problem or just unfinished content in disguise. Automating around a content gap doesn't close it — it hides it.

**Follow-up hooks:**
- *"Why not have Claude generate the missing decision tables from the project code?"* → Considered and rejected, same reasoning as Decision #1's authenticity line — this portfolio represents someone's own thinking, and auto-generating "why I made this choice" content blurs whose reasoning it actually is.
- *"Doesn't this mean the design work on this tool was wasted?"* → No — the review is what revealed it was a content gap, not an architecture gap. Skipping the review and building a normalization parser first would have been the wasted work.

### Decision #3 — Freshness & Service Count: In-Process Background Refresh, Not a Third Service
**Resolved:** 2026-08-03 (open questions #3 and #6 resolved together)

> *Answer to: "Tell me about a time a new requirement almost added unnecessary infrastructure."*

**Setup**
Two open questions turned out to be coupled: #3 (how does content freshness get maintained, and how do new GitHub projects get discovered automatically) and #6 (is this a two-service or three-service architecture).

**The problem**
The natural first instinct for freshness was "add a cron job." But a cron job is typically its own deployable — which immediately raises a second problem: how does its output (a re-parsed, re-embedded dataset) reach the MCP server that actually answers queries? That requires shared storage — a database or volume — between two independently deployed services, just to move a JSON file on a schedule.

**The diagnosis**
Separated two different kinds of components that had gotten conflated: **services that answer live queries** vs. **jobs that run on a schedule and update data**. Only the first kind changes the service count. Freshness is a batch-update concern, not a live-query concern — it doesn't need to be a service at all.

**The decision**
The refresh logic — GitHub API discovery of all repos (not a hardcoded list of 5), re-parsing, re-embedding new content into the Decision #1 taxonomy — runs as an in-process background task inside the MCP server's own process, on a daily schedule. It updates the MCP server's own dataset directly, no shared storage needed. The refresh capability is also entirely internal: no public MCP tool exposes it, protecting the lean 5-tool surface from Decision #1's token-cost lesson. External users never trigger or see a refresh — they just get an answer that happens to already reflect whatever the last cycle picked up. Final shape: 2 services (MCP server with refresh built in, web chat backend), not 3.

**Why this wasn't free**
An in-process scheduler resets on every redeploy of the MCP server, so freshness is bounded by "however long since the last restart," not a hard guarantee. That's an acceptable tradeoff at a refresh cadence of roughly daily against a source update cadence of a few times a week — it would be the wrong call for a system that needed near-real-time freshness, where the shared-storage cost of a separate service would actually be justified.

**PM reflection**
A new requirement doesn't automatically need a new architectural tier. Before adding a service, check whether the new capability is a live-query concern or a batch-update concern — conflating the two is how systems accumulate services that don't need to exist.

**Follow-up hooks:**
- *"What happens if a source repo updates right after a refresh cycle just ran?"* → It's stale until the next cycle. Acceptable given the daily cadence against a few-times-a-week update frequency — the parameter to shrink first if that ever stopped being true.
- *"Why not expose a 'refresh now' tool for external users?"* → Considered and rejected — same token-cost reasoning as Decision #1. Every tool in the public schema costs tokens on every single query, for a capability almost no external user would ever invoke.

### Decision #4 — Fuzzy Project-Name Matching
**Resolved:** 2026-08-03

Reused the Decision #1 embedding infrastructure against a different corpus: known project names and taglines instead of concept phrases. Tool inputs are LLM-generated, not selected from a dropdown, so a query like "the sleep app" needs to resolve to "Circadia" without exact string matching. Cosine similarity against the project-name embeddings handles this with no new infrastructure. Below-threshold queries return "no matching project found" explicitly, rather than silently force-matching to whichever project happened to be closest — a wrong-but-confident answer is worse than an honest miss, especially given this project's dual-purpose bar (rule 9).

### Decision #5 — Web Chat Backend Cost Exposure
**Resolved:** 2026-08-03

The MCP server serves static parsed JSON — cheap, fine to leave fully open. The web chat backend calls the Claude API on every message — not cheap, and unbounded if the page gets scraped or hit with junk queries. These are two different risk surfaces; only the first was actually assessed when "fully open" was originally decided. Fix: rate limiting by IP, plus a global daily cost ceiling as a circuit breaker — if hit, the page shows a friendly "check back tomorrow" message rather than erroring or silently continuing to spend. Thresholds are left as dynamic config rather than hardcoded, since the right numbers depend on real traffic patterns that don't exist yet — tuning happens post-launch, not now.

### Decision #7 — Web Chat Backend Loop: Hand-Rolled, Not the MCP Connector
**Resolved:** 2026-08-03

> *Answer to: "Tell me about a time you chose the harder technical path on purpose."*

**Setup**
The web chat backend needs something that takes a visitor's plain-English question, decides which MCP tool(s) answer it, calls them, and turns the result into prose. Two ways to build that: hand-roll the tool-calling loop as code (`tool_choice="auto"`, dispatch, loop until Claude gives a final answer), or use Claude's managed MCP connector (beta), where Anthropic's own API infrastructure runs that loop internally and just returns a finished answer.

**The problem**
The connector ships faster — it's a config value (a server URL) instead of a loop to write, test, and debug. But it's also a black box: the tool-selection and dispatch logic happens inside Anthropic's infrastructure, invisible to the code and to anyone reading it later.

**The decision**
Hand-rolled, deliberately. This project's entire premise is learning MCP by building it, not by configuring a managed feature around it — and the hand-rolled loop is the exact same pattern already proven twice in this portfolio (Ghost-Cart's Restock/Nudge agents, research-synthesizer's ReAct loop), so it's reinforcement of a real skill, not new unproven ground. The managed connector would ship the feature faster, but there would be nothing to point to as "I built this" — the orchestration, which is the actual interesting engineering here, would belong to Anthropic's infrastructure, not to this project.

**Why this wasn't the "efficient" choice**
Being honest about it: for a team optimizing purely for time-to-ship, the connector is the better call — less code, less to maintain, less that can break in a hand-rolled loop. This project chose more work on purpose because the work itself is the point.

**PM reflection**
Speed-to-ship and learning value aren't always the same axis, and a real product decision sometimes means picking the slower option deliberately — as long as that tradeoff is named explicitly, not stumbled into. The failure mode isn't choosing the harder path; it's choosing it by accident and calling it a technical requirement.

**Follow-up hooks:**
- *"Would you make the same call for a production system with paying users?"* → No — the connector's speed and reduced maintenance surface would likely win for a team shipping under real deadline and reliability pressure. The call here is specific to this being a deliberate learning project.
- *"What do you lose by not using the connector?"* → Faster shipping and less code to maintain. What's gained: full visibility into every tool call, and a second working example (beyond Ghost-Cart and research-synthesizer) of the same agentic loop pattern to point to in an interview.

---

## Progress Log
| Date | Milestone |
|---|---|
| 2026-08-03 | Project initiated. Content schema, 5 MCP tools, and stack (Python/FastMCP/Streamable HTTP/Railway) designed and agreed. Ground rules imported from Circadia and adapted: eval scope widened to tool + conversational layers (rule 5), dual-purpose framing added (rule 9), deployment-approval rule added (rule 14). Architecture reviewed — 7 open items surfaced, concept taxonomy identified as highest priority. Project name not yet chosen. |
| 2026-08-03 | Open question #1 (concept taxonomy) resolved — hybrid approach (canonical buckets + embedding-based auto-assignment). Full decision + interview story documented in Decisions Log. |
| 2026-08-03 | Open question #2 (`get_key_decisions` uneven coverage) resolved — diagnosed as a content gap, not an architecture gap. All 5 source repos brought to an identical decision-table format directly; no parser normalization logic needed. |
| 2026-08-03 | Open questions #3 (freshness/refresh) and #6 (service count) resolved together — in-process background refresh job inside the MCP server (GitHub API discovery + re-parse + re-embed), not a third service. Refresh is internal-only, no public tool exposes it. Architecture confirmed at 2 services. |
| 2026-08-03 | Final 3 open questions resolved. #4: fuzzy project-name matching via the Decision #1 embedding infra. #5: rate limiting by IP + dynamic global cost ceiling for the web chat backend. #7: hand-rolled tool-use loop chosen deliberately over Claude's MCP connector, for the learning reps. All 7 open questions from the architecture review are now closed. |
