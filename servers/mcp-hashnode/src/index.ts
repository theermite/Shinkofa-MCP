#!/usr/bin/env node
/**
 * @shinkofa/mcp-hashnode — MCP server for Hashnode GraphQL API.
 *
 * Provides typed tools for posts, drafts, series, comments,
 * and a raw_graphql fallback for 100% coverage.
 *
 * Usage:
 *   HASHNODE_PAT=xxx npx @shinkofa/mcp-hashnode
 *
 * Or in Claude Code settings:
 *   {
 *     "mcpServers": {
 *       "hashnode": {
 *         "command": "npx",
 *         "args": ["@shinkofa/mcp-hashnode"],
 *         "env": { "HASHNODE_PAT": "your-personal-access-token" }
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HashnodeClient } from "./lib/client.js";
import { registerCommunityTools } from "./tools/community.js";
import { registerDraftTools } from "./tools/drafts.js";
import { registerPostTools } from "./tools/posts.js";
import { registerRawTools } from "./tools/raw.js";

async function main(): Promise<void> {
  const pat = process.env.HASHNODE_PAT;

  if (!pat) {
    console.error("Error: HASHNODE_PAT environment variable is required");
    process.exit(1);
  }

  const client = new HashnodeClient({
    pat,
    endpoint: process.env.HASHNODE_ENDPOINT,
    timeoutMs: process.env.HASHNODE_TIMEOUT_MS ? parseInt(process.env.HASHNODE_TIMEOUT_MS, 10) || undefined : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-hashnode",
    version: "1.0.0",
  });

  registerPostTools(server, client);
  registerDraftTools(server, client);
  registerCommunityTools(server, client);
  registerRawTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
