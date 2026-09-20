// Shared MCP server definition — the tools, schemas, and data loading are
// identical regardless of which transport connects to them. This is the
// concrete proof of the transport-agnostic point: getServer() has no idea
// whether it'll be wired to Streamable HTTP or stdio.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { Project } from "../parser/types.js";

// Resolved relative to this file's own location, not process.cwd() — the
// stdio transport gets spawned by Claude Code itself, so the caller's
// working directory can't be relied on.
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const GHOST_CART_DATA_PATH = join(__dirname, "..", "..", "data", "ghost-cart.json");
const projects: Project[] = [
  JSON.parse(readFileSync(GHOST_CART_DATA_PATH, "utf-8")) as Project,
];

function findProject(name: string): Project | undefined {
  return projects.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

export function getServer() {
  const server = new McpServer(
    { name: "throughline", version: "0.1.0" },
    { capabilities: {} }
  );

  server.registerTool(
    "get_project_overview",
    {
      description:
        "Returns the purpose, tagline, tech stack, and status for one of Abhishek's AI portfolio projects.",
      inputSchema: {
        projectName: z
          .string()
          .describe('Project name, e.g. "Ghost-Cart" (Phase 0: exact match only)'),
      },
    },
    async ({ projectName }) => {
      const project = findProject(projectName);
      if (!project) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No matching project found for "${projectName}".`,
            },
          ],
        };
      }
      const { name, tagline, status, techStack, architecture } = project;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { name, tagline, status, techStack, overview: architecture.overview },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_key_decisions",
    {
      description:
        "Returns the 'why we chose X over Y' architecture decisions for one of Abhishek's AI portfolio projects.",
      inputSchema: {
        projectName: z
          .string()
          .describe('Project name, e.g. "Ghost-Cart" (Phase 0: exact match only)'),
      },
    },
    async ({ projectName }) => {
      const project = findProject(projectName);
      if (!project) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No matching project found for "${projectName}".`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(project.architecture.keyDecisions, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

export function loadedProjectNames(): string[] {
  return projects.map((p) => p.name);
}
