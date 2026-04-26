#!/usr/bin/env node
/**
 * @shinkofa/mcp-google-drive — MCP server for Google Drive API v3.
 *
 * 14 typed tools: list, get, read (auto-detect download/export), create,
 * create folder, update, move, copy, delete, export, share, list permissions,
 * remove permission + raw escape hatch.
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
import { DriveClient } from "./lib/client.js";
import { registerFileTools } from "./tools/files.js";
import { registerRawTool } from "./tools/raw.js";
import { registerSharingTools } from "./tools/sharing.js";

async function main(): Promise<void> {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Error: GOOGLE_ACCESS_TOKEN environment variable is required");
    process.exit(1);
  }

  const client = new DriveClient({
    accessToken,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    timeoutMs: process.env.GOOGLE_DRIVE_TIMEOUT_MS ? parseInt(process.env.GOOGLE_DRIVE_TIMEOUT_MS, 10) : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-google-drive",
    version: "1.0.0",
  });

  registerFileTools(server, client);
  registerSharingTools(server, client);
  registerRawTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
