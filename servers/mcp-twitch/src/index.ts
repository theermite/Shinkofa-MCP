#!/usr/bin/env node
/**
 * @shinkofa/mcp-twitch — MCP server for Twitch Helix API.
 *
 * Provides typed tools for channels, chat, moderation, streams, channel points,
 * polls, predictions, raids, ads, clips, schedule, videos, search, games,
 * users, subscriptions, whispers, eventsub + raw_api_call for 100% coverage.
 *
 * Usage:
 *   TWITCH_CLIENT_ID=xxx TWITCH_CLIENT_SECRET=yyy npx @shinkofa/mcp-twitch
 *
 * Or with a user access token:
 *   TWITCH_CLIENT_ID=xxx TWITCH_ACCESS_TOKEN=zzz npx @shinkofa/mcp-twitch
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TwitchClient } from "./lib/client.js";
import { registerChannelTools } from "./tools/channels.js";
import { registerChatTools } from "./tools/chat.js";
import { registerModerationTools } from "./tools/moderation.js";
import { registerStreamTools } from "./tools/streams.js";
import { registerPointsTools } from "./tools/points.js";
import { registerInteractiveTools } from "./tools/interactive.js";
import { registerContentTools } from "./tools/content.js";
import { registerRawTool } from "./tools/raw.js";

async function main(): Promise<void> {
  const clientId = process.env["TWITCH_CLIENT_ID"];

  if (!clientId) {
    console.error("Error: TWITCH_CLIENT_ID environment variable is required");
    process.exit(1);
  }

  const client = new TwitchClient({
    clientId,
    clientSecret: process.env["TWITCH_CLIENT_SECRET"],
    accessToken: process.env["TWITCH_ACCESS_TOKEN"],
    apiBaseUrl: process.env["TWITCH_API_BASE_URL"],
    timeoutMs: process.env["TWITCH_TIMEOUT_MS"]
      ? parseInt(process.env["TWITCH_TIMEOUT_MS"], 10) || undefined
      : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-twitch",
    version: "1.0.0",
  });

  registerChannelTools(server, client);
  registerChatTools(server, client);
  registerModerationTools(server, client);
  registerStreamTools(server, client);
  registerPointsTools(server, client);
  registerInteractiveTools(server, client);
  registerContentTools(server, client);
  registerRawTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
