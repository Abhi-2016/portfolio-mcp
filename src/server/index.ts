// Phase 0 Streamable HTTP entry point — for the eventual remote/Railway
// deployment. See stdio.ts for the local-dev entry point used with
// Claude Desktop. Both share the exact same tools, defined once in server.ts.
//
// Stateless by design (sessionIdGenerator: undefined) — matches Decision
// #3/#6's architecture: no session state held server-side.

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { getServer, loadedProjectNames } from "./server.js";

const app = createMcpExpressApp({ host: "127.0.0.1" });

app.post("/mcp", async (req, res) => {
  try {
    const server = getServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Stateless transport doesn't support GET (SSE streams) or DELETE (session
// termination) — reject explicitly rather than letting them 404 silently.
app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});
app.delete("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

const PORT = Number(process.env.PORT) || 3939;
app.listen(PORT, () => {
  console.log(`Throughline MCP server (Phase 0) listening on port ${PORT}`);
  console.log(`Loaded project(s): ${loadedProjectNames().join(", ")}`);
});
