#!/usr/bin/env node
/**
 * @shinkofa/mcp-obs — MCP server for OBS Studio.
 *
 * Provides 71 typed tools for scenes, sources, streaming,
 * recording, filters, transitions, and more via OBS WebSocket v5.
 *
 * Environment variables:
 *   OBS_WEBSOCKET_URL      — WebSocket URL (default: "ws://127.0.0.1:4455")
 *   OBS_WEBSOCKET_PASSWORD — Authentication password (optional)
 *
 * Usage in Claude Code:
 *   {
 *     "mcpServers": {
 *       "obs": {
 *         "command": "node",
 *         "args": ["path/to/dist/index.js"]
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createConfig, OBSClient } from "./lib/client.js";
import { registerFilterTools } from "./tools/filters.js";
import { registerGeneralTools } from "./tools/general.js";
import { registerInputTools } from "./tools/inputs.js";
import { registerSceneTools } from "./tools/scenes.js";
import { registerStreamingTools } from "./tools/streaming.js";
import { registerTransitionTools } from "./tools/transitions.js";

async function main(): Promise<void> {
  const config = createConfig(process.env);
  const obs = new OBSClient(config);

  const server = new McpServer({
    name: "@shinkofa/mcp-obs",
    version: "1.0.0",
  });

  registerGeneralTools(server, obs);
  registerSceneTools(server, obs);
  registerInputTools(server, obs);
  registerFilterTools(server, obs);
  registerStreamingTools(server, obs);
  registerTransitionTools(server, obs);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
