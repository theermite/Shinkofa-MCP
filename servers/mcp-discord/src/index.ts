#!/usr/bin/env node
/**
 * @shinkofa/mcp-discord — MCP server for Discord REST API v10.
 *
 * Provides typed tools for server management, messages, channels, members,
 * roles, webhooks, commands, interactions, emojis, events, moderation,
 * invites + raw_api_call for 100% coverage.
 *
 * Usage:
 *   DISCORD_BOT_TOKEN=xxx npx @shinkofa/mcp-discord
 *
 * Or in Claude Code settings:
 *   {
 *     "mcpServers": {
 *       "discord": {
 *         "command": "npx",
 *         "args": ["@shinkofa/mcp-discord"],
 *         "env": { "DISCORD_BOT_TOKEN": "your-token" }
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DiscordClient } from "./lib/client.js";
import { registerChannelTools } from "./tools/channels.js";
import { registerCommandTools } from "./tools/commands.js";
import { registerEmojiTools } from "./tools/emojis.js";
import { registerEventTools } from "./tools/events.js";
import { registerGuildTools } from "./tools/guilds.js";
import { registerInteractionTools } from "./tools/interactions.js";
import { registerInviteTools } from "./tools/invites.js";
import { registerMemberTools } from "./tools/members.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerModerationTools } from "./tools/moderation.js";
import { registerRawTool } from "./tools/raw.js";
import { registerUserTools } from "./tools/users.js";
import { registerWebhookTools } from "./tools/webhooks.js";

async function main(): Promise<void> {
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    console.error("Error: DISCORD_BOT_TOKEN environment variable is required");
    process.exit(1);
  }

  const client = new DiscordClient({
    botToken,
    apiBaseUrl: process.env.DISCORD_API_BASE_URL,
    timeoutMs: process.env.DISCORD_TIMEOUT_MS ? parseInt(process.env.DISCORD_TIMEOUT_MS, 10) || undefined : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-discord",
    version: "1.0.0",
  });

  // Register all tool groups
  registerMessageTools(server, client);
  registerChannelTools(server, client);
  registerGuildTools(server, client);
  registerMemberTools(server, client);
  registerWebhookTools(server, client);
  registerCommandTools(server, client);
  registerInteractionTools(server, client);
  registerUserTools(server, client);
  registerEmojiTools(server, client);
  registerEventTools(server, client);
  registerModerationTools(server, client);
  registerInviteTools(server, client);
  registerRawTool(server, client);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
