#!/usr/bin/env node
/**
 * @shinkofa/mcp-searxng — MCP server for self-hosted SearXNG metasearch.
 *
 * Provides two tools:
 *   - searxng_web_search: general web search (aggregates Google/Bing/DuckDuckGo/Qwant/...)
 *   - searxng_news_search: recent news search with time filtering
 *
 * Privacy-respecting (no query tracking), free (self-hosted), unlimited.
 *
 * Env vars:
 *   SEARXNG_BASE_URL  — SearXNG instance URL (default: http://localhost:8080)
 *   SEARXNG_TIMEOUT_MS — request timeout (default: 30000)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { connectTransport } from "@shinkofa/mcp-shared";
import { SearxngClient } from "./lib/client.js";
import { registerSearchTools } from "./tools/search.js";

async function main(): Promise<void> {
  const client = new SearxngClient({
    baseUrl: process.env.SEARXNG_BASE_URL,
    timeoutMs: process.env.SEARXNG_TIMEOUT_MS ? parseInt(process.env.SEARXNG_TIMEOUT_MS, 10) || undefined : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-searxng",
    version: "1.0.0",
  });

  registerSearchTools(server, client);

  await connectTransport(server);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
