// Phase 0 walking skeleton: parses Ghost-Cart's README.md into the shared
// Project schema and writes data/ghost-cart.json.
//
// Deliberately narrow — Ghost-Cart only, hardcoded heading strings, no
// generic multi-project abstraction yet. That generalization is Phase 2's
// job, once the schema has been proven against one real project first.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { extractSection, parseFirstTable } from "./markdown.js";
import type { Project, Reflection } from "./types.js";

// Sibling directory under Documents — matches every other project's local
// layout. Phase 7's refresh job will read from the GitHub API instead; this
// local-filesystem path is fine for the Phase 0 walking skeleton only.
const GHOST_CART_DIR = join(process.cwd(), "..", "Ghost-Cart");
const GHOST_CART_README = join(GHOST_CART_DIR, "README.md");
const GHOST_CART_CLAUDE_MD = join(GHOST_CART_DIR, "CLAUDE.md");
const OUTPUT_PATH = join(process.cwd(), "data", "ghost-cart.json");

function extractTagline(markdown: string): string {
  const match = /^>\s+(.+)$/m.exec(markdown);
  if (!match) throw new Error("Tagline blockquote not found");
  return match[1].trim();
}

function extractStatus(markdown: string): string {
  return markdown.includes("✅ Live") ? "Live in production" : "In development";
}

function parseReflectionTag(call: string): { tag: string | null; call: string } {
  const match = /^\*\*\[(\w+)\]\*\*\s*(.*)$/.exec(call);
  return match ? { tag: match[1], call: match[2] } : { tag: null, call };
}

function main() {
  const markdown = readFileSync(GHOST_CART_README, "utf-8");
  // Architecture Decisions lives in CLAUDE.md, not README.md — everything
  // else (tagline, tech stack, concepts, wrong calls) is in README.md.
  const claudeMd = readFileSync(GHOST_CART_CLAUDE_MD, "utf-8");

  const tagline = extractTagline(markdown);
  const status = extractStatus(markdown);

  const overview = extractSection(markdown, "What is Ghost-Cart?").trim();

  const techStackRows = parseFirstTable(
    extractSection(markdown, "Tech Stack")
  );
  const techStack = techStackRows.map((r) => ({
    layer: r["Layer"],
    technology: r["Technology"],
  }));

  const decisionRows = parseFirstTable(
    extractSection(claudeMd, "Architecture Decisions")
  );
  const keyDecisions = decisionRows.map((r) => ({
    decision: r["Decision"],
    what: r["What Was Decided"],
    why: r["Why"],
  }));

  const conceptCategories = {
    "Agentic AI":
      "Agentic AI — how Claude was given autonomy to decide and act",
    "AI PM": "AI PM — product decisions specific to AI-powered systems",
    "Classic PM":
      "Classic PM — foundational product management applied throughout",
  };
  const conceptsPracticed: Project["conceptsPracticed"] = {};
  for (const [category, heading] of Object.entries(conceptCategories)) {
    const rows = parseFirstTable(extractSection(markdown, heading));
    conceptsPracticed[category] = rows.map((r) => ({
      concept: r["Concept"],
      wherePracticed: r["Where Practised"],
    }));
  }

  const reflectionRows = parseFirstTable(
    extractSection(markdown, "Key Wrong Calls — and Corrections")
  );
  const reflections: Reflection[] = reflectionRows.map((r) => {
    const { tag, call } = parseReflectionTag(r["Wrong Call"]);
    return {
      tag,
      call,
      whyWrong: r["Why It Was Wrong"],
      correction: r["What We Did Instead"],
    };
  });

  const project: Project = {
    name: "Ghost-Cart",
    tagline,
    status,
    techStack,
    architecture: { overview, keyDecisions },
    conceptsPracticed,
    reflections,
    lastParsed: new Date().toISOString(),
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(project, null, 2));
  console.log(`Parsed Ghost-Cart → ${OUTPUT_PATH}`);
  console.log(`  ${keyDecisions.length} architecture decisions`);
  console.log(
    `  ${Object.values(conceptsPracticed).flat().length} concepts practised`
  );
  console.log(`  ${reflections.length} reflections`);
}

main();
