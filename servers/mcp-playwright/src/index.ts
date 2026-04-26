#!/usr/bin/env node
/**
 * @shinkofa/mcp-playwright — MCP server for browser automation via Playwright
 *
 * Environment variables (all optional):
 *   PLAYWRIGHT_HEADLESS  — "false" to run with visible browser (default: true)
 *   PLAYWRIGHT_TIMEOUT   — default timeout in ms (default: 30000)
 *
 * Claude Code settings.json:
 *   "mcpServers": {
 *     "playwright": {
 *       "command": "node",
 *       "args": ["D:/30-Dev-Projects/Shinkofa-MCP/servers/mcp-playwright/dist/index.js"]
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BrowserManager } from "./lib/browser.js";
import { registerContentTools } from "./tools/content.js";
import { registerInteractionTools } from "./tools/interaction.js";
import { registerNavigationTools } from "./tools/navigation.js";
import { registerQueryTools } from "./tools/query.js";
import { registerSessionTools } from "./tools/session.js";

async function main(): Promise<void> {
  const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";
  const timeout = process.env.PLAYWRIGHT_TIMEOUT ? parseInt(process.env.PLAYWRIGHT_TIMEOUT, 10) || undefined : undefined;

  const browser = new BrowserManager({ headless, defaultTimeout: timeout });

  const server = new McpServer({
    name: "@shinkofa/mcp-playwright",
    version: "1.0.0",
  });

  registerNavigationTools(server, browser);
  registerContentTools(server, browser);
  registerInteractionTools(server, browser);
  registerQueryTools(server, browser);
  registerSessionTools(server, browser);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", async () => {
    await browser.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await browser.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
