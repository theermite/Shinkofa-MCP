#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerInfoTools } from "./tools/info.js";
import { registerResourceTools } from "./tools/resources.js";
import { registerProcessTools } from "./tools/processes.js";
import { registerExecTools } from "./tools/exec.js";
import { isExecAllowed } from "./lib/utils.js";

const server = new McpServer({
  name: "@shinkofa/mcp-system",
  version: "1.0.0",
});

registerInfoTools(server);
registerResourceTools(server);
registerProcessTools(server);

if (isExecAllowed()) {
  registerExecTools(server);
  console.error(
    "[mcp-system] MCP_SYSTEM_ALLOW_EXEC=true — exec/kill/read/write tools ENABLED",
  );
} else {
  console.error(
    "[mcp-system] exec tools disabled (set MCP_SYSTEM_ALLOW_EXEC=true to enable)",
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
