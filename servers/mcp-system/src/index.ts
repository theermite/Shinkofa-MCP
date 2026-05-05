#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { connectTransport } from "@shinkofa/mcp-shared";
import { isExecAllowed } from "./lib/utils.js";
import { registerExecTools } from "./tools/exec.js";
import { registerInfoTools } from "./tools/info.js";
import { registerProcessTools } from "./tools/processes.js";
import { registerResourceTools } from "./tools/resources.js";

const server = new McpServer({
  name: "@shinkofa/mcp-system",
  version: "1.0.0",
});

registerInfoTools(server);
registerResourceTools(server);
registerProcessTools(server);

if (isExecAllowed()) {
  registerExecTools(server);
  console.error("[mcp-system] MCP_SYSTEM_ALLOW_EXEC=true — exec/kill/read/write tools ENABLED");
} else {
  console.error("[mcp-system] exec tools disabled (set MCP_SYSTEM_ALLOW_EXEC=true to enable)");
}

await connectTransport(server);
