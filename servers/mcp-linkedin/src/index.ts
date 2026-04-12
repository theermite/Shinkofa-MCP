#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LinkedInClient } from "./lib/client.js";
import { registerPostTools } from "./tools/posts.js";
import { registerProfileTools } from "./tools/profile.js";
import { registerRawTools } from "./tools/raw.js";

const accessToken = process.env["LINKEDIN_ACCESS_TOKEN"];
if (!accessToken) {
  console.error("LINKEDIN_ACCESS_TOKEN environment variable is required");
  process.exit(1);
}

const client = new LinkedInClient({
  accessToken,
  apiVersion: process.env["LINKEDIN_API_VERSION"],
  timeoutMs: process.env["LINKEDIN_TIMEOUT_MS"]
    ? Number(process.env["LINKEDIN_TIMEOUT_MS"])
    : undefined,
});

const server = new McpServer({
  name: "@shinkofa/mcp-linkedin",
  version: "1.0.0",
});

registerPostTools(server, client);
registerProfileTools(server, client);
registerRawTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
