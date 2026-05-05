#!/usr/bin/env node
/**
 * @shinkofa/mcp-telegram — MCP server for Telegram Bot API.
 *
 * Provides typed tools for common operations + raw_api_call for 100% coverage.
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=xxx npx @shinkofa/mcp-telegram
 *
 * Or in Claude Code settings:
 *   {
 *     "mcpServers": {
 *       "telegram": {
 *         "command": "npx",
 *         "args": ["@shinkofa/mcp-telegram"],
 *         "env": { "TELEGRAM_BOT_TOKEN": "your-token" }
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { connectTransport } from "@shinkofa/mcp-shared";
import { TelegramClient } from "./lib/client.js";
import { registerBotTools } from "./tools/bot.js";
import { registerChatTools } from "./tools/chat.js";
import { registerMediaTools } from "./tools/media.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerRawTool } from "./tools/raw.js";

async function main(): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("Error: TELEGRAM_BOT_TOKEN environment variable is required");
    process.exit(1);
  }

  const client = new TelegramClient({
    botToken,
    apiBaseUrl: process.env.TELEGRAM_API_BASE_URL,
    timeoutMs: process.env.TELEGRAM_TIMEOUT_MS ? parseInt(process.env.TELEGRAM_TIMEOUT_MS, 10) || undefined : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-telegram",
    version: "1.0.0",
  });

  // Register all tool groups
  registerMessageTools(server, client);
  registerMediaTools(server, client);
  registerChatTools(server, client);
  registerBotTools(server, client);
  registerRawTool(server, client);

  // Connect via stdio transport
  await connectTransport(server);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
