#!/usr/bin/env node
/**
 * @shinkofa/mcp-google-calendar — MCP server for Google Calendar API v3.
 *
 * Typed tools for events, calendars, calendar list, ACL, free/busy,
 * settings, colors + raw_api_call for 100% coverage.
 *
 * Usage:
 *   GOOGLE_ACCESS_TOKEN=ya29.xxx npx @shinkofa/mcp-google-calendar
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleCalendarClient } from "./lib/client.js";
import { registerEventTools } from "./tools/events.js";
import { registerCalendarTools } from "./tools/calendars.js";
import { registerAclTools } from "./tools/acl.js";
import { registerRawTool } from "./tools/raw.js";

async function main(): Promise<void> {
  const accessToken = process.env["GOOGLE_ACCESS_TOKEN"];

  if (!accessToken) {
    console.error("Error: GOOGLE_ACCESS_TOKEN environment variable is required");
    process.exit(1);
  }

  const client = new GoogleCalendarClient({
    accessToken,
    apiBaseUrl: process.env["GOOGLE_CALENDAR_API_BASE_URL"],
    timeoutMs: process.env["GOOGLE_CALENDAR_TIMEOUT_MS"]
      ? parseInt(process.env["GOOGLE_CALENDAR_TIMEOUT_MS"], 10)
      : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-google-calendar",
    version: "1.0.0",
  });

  registerEventTools(server, client);
  registerCalendarTools(server, client);
  registerAclTools(server, client);
  registerRawTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
