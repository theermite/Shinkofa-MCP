#!/usr/bin/env node
/**
 * @shinkofa/mcp-google-calendar — MCP server for Google Calendar API v3.
 *
 * Required:
 *   GOOGLE_ACCESS_TOKEN=ya29.xxx
 *
 * Optional (enables auto-refresh when token expires):
 *   GOOGLE_REFRESH_TOKEN=1//xxx
 *   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
 *   GOOGLE_CLIENT_SECRET=xxx
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
    refreshToken: process.env["GOOGLE_REFRESH_TOKEN"],
    clientId: process.env["GOOGLE_CLIENT_ID"],
    clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
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
