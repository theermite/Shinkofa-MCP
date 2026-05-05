#!/usr/bin/env node
/**
 * @shinkofa/mcp-devto — MCP server for DEV.to (Forem) API.
 *
 * Provides typed tools for articles, comments, tags, users,
 * reactions, and a raw_api_call fallback for 100% coverage.
 *
 * Usage:
 *   DEVTO_API_KEY=xxx npx @shinkofa/mcp-devto
 *
 * Or in Claude Code settings:
 *   {
 *     "mcpServers": {
 *       "devto": {
 *         "command": "npx",
 *         "args": ["@shinkofa/mcp-devto"],
 *         "env": { "DEVTO_API_KEY": "your-api-key" }
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { connectTransport } from "@shinkofa/mcp-shared";
import { DevtoClient } from "./lib/client.js";
import { registerArticleTools } from "./tools/articles.js";
import { registerCommunityTools } from "./tools/community.js";
import { registerRawTools } from "./tools/raw.js";

async function main(): Promise<void> {
  const apiKey = process.env.DEVTO_API_KEY;

  if (!apiKey) {
    console.error("Error: DEVTO_API_KEY environment variable is required");
    process.exit(1);
  }

  const client = new DevtoClient({
    apiKey,
    baseUrl: process.env.DEVTO_BASE_URL,
    timeoutMs: process.env.DEVTO_TIMEOUT_MS ? parseInt(process.env.DEVTO_TIMEOUT_MS, 10) || undefined : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-devto",
    version: "1.0.0",
  });

  registerArticleTools(server, client);
  registerCommunityTools(server, client);
  registerRawTools(server, client);

  await connectTransport(server);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
