#!/usr/bin/env node
/**
 * @shinkofa/mcp-streamerbot — MCP server for Streamer.bot.
 *
 * Provides typed tools for actions, chat, events, globals,
 * credits, and code triggers via WebSocket.
 *
 * Environment variables:
 *   STREAMERBOT_HOST              — WebSocket host (default: "127.0.0.1")
 *   STREAMERBOT_PORT              — WebSocket port (default: "8080")
 *   STREAMERBOT_CONNECT_TIMEOUT_MS — Connection timeout in ms (default: 5000)
 *   STREAMERBOT_REQUEST_TIMEOUT_MS — Request timeout in ms (default: 10000)
 *
 * Usage in Claude Code:
 *   {
 *     "mcpServers": {
 *       "streamerbot": {
 *         "command": "node",
 *         "args": ["path/to/dist/index.js"]
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createConfig, StreamerbotClient } from "./lib/client.js";
import { registerInfoTools } from "./tools/info.js";
import { registerActionTools } from "./tools/actions.js";
import { registerEventTools } from "./tools/events.js";
import { registerCreditTools } from "./tools/credits.js";
import { registerGlobalTools } from "./tools/globals.js";
import { registerTriggerTools } from "./tools/triggers.js";

async function main(): Promise<void> {
  const config = createConfig(process.env);
  const client = new StreamerbotClient(config);

  const server = new McpServer({
    name: "@shinkofa/mcp-streamerbot",
    version: "1.0.0",
  });

  registerInfoTools(server, client);
  registerActionTools(server, client);
  registerEventTools(server, client);
  registerCreditTools(server, client);
  registerGlobalTools(server, client);
  registerTriggerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
