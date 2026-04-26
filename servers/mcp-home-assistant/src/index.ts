#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HAClient } from "./lib/client.js";
import { registerEntityTools } from "./tools/entities.js";
import { registerInfoTools } from "./tools/info.js";

async function main(): Promise<void> {
  const token = process.env.HA_ACCESS_TOKEN;
  const baseUrl = process.env.HA_BASE_URL;
  if (!token || !baseUrl) {
    console.error("Error: HA_ACCESS_TOKEN and HA_BASE_URL required");
    process.exit(1);
  }
  const client = new HAClient({
    accessToken: token,
    baseUrl,
    timeoutMs: process.env.HA_TIMEOUT_MS ? parseInt(process.env.HA_TIMEOUT_MS, 10) : undefined,
  });
  const server = new McpServer({ name: "@shinkofa/mcp-home-assistant", version: "1.0.0" });
  registerEntityTools(server, client);
  registerInfoTools(server, client);
  await server.connect(new StdioServerTransport());
}
main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
