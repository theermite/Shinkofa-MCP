#!/usr/bin/env node
/**
 * @shinkofa/mcp-obsidian — MCP server for Obsidian Local REST API.
 *
 * Requires the "Local REST API" community plugin in Obsidian.
 *
 * Usage:
 *   OBSIDIAN_API_KEY=xxx npx @shinkofa/mcp-obsidian
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ObsidianClient } from "./lib/client.js";
import { registerVaultTools } from "./tools/vault.js";

async function main(): Promise<void> {
  const apiKey = process.env["OBSIDIAN_API_KEY"];
  if (!apiKey) { console.error("Error: OBSIDIAN_API_KEY environment variable is required"); process.exit(1); }

  const client = new ObsidianClient({
    apiKey,
    baseUrl: process.env["OBSIDIAN_API_URL"],
    timeoutMs: process.env["OBSIDIAN_TIMEOUT_MS"] ? parseInt(process.env["OBSIDIAN_TIMEOUT_MS"], 10) : undefined,
  });

  const server = new McpServer({ name: "@shinkofa/mcp-obsidian", version: "1.0.0" });
  registerVaultTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => { console.error("Fatal error:", error); process.exit(1); });
