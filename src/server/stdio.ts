// Phase 0 stdio entry point — for local testing via Claude Desktop, which
// spawns this as a child process and talks to it over stdin/stdout. No
// network, no HTTPS requirement, nothing to configure beyond a file path.
//
// Same getServer() as index.ts — the tools don't know or care which
// transport is connected to them.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getServer } from "./server.js";

async function main() {
  const server = getServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Nothing is logged to stdout here — stdout is the transport's message
  // channel to the client. Anything printed there would corrupt the
  // protocol stream. Use stderr for any local debugging output instead.
}

main().catch((error) => {
  console.error("Fatal error starting stdio server:", error);
  process.exit(1);
});
