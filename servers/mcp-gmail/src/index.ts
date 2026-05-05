#!/usr/bin/env node
/**
 * @shinkofa/mcp-gmail — MCP server for Gmail API v1.
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
import { connectTransport } from "@shinkofa/mcp-shared";
import { GmailClient } from "./lib/client.js";
import { registerDraftTools } from "./tools/drafts.js";
import { registerLabelTools } from "./tools/labels.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerMiscTools } from "./tools/misc.js";
import { registerThreadTools } from "./tools/threads.js";

async function main(): Promise<void> {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Error: GOOGLE_ACCESS_TOKEN is required");
    process.exit(1);
  }

  const rawTimeout = process.env.GMAIL_TIMEOUT_MS ? parseInt(process.env.GMAIL_TIMEOUT_MS, 10) : undefined;
  const timeoutMs = rawTimeout !== undefined && Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : undefined;

  const client = new GmailClient({
    accessToken,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    apiBaseUrl: process.env.GMAIL_API_BASE_URL,
    timeoutMs,
  });

  const server = new McpServer({ name: "@shinkofa/mcp-gmail", version: "1.0.0" });
  registerMessageTools(server, client);
  registerDraftTools(server, client);
  registerLabelTools(server, client);
  registerThreadTools(server, client);
  registerMiscTools(server, client);

  await connectTransport(server);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
