#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { N8nClient } from "./lib/client.js";
import { registerWorkflowTools } from "./tools/workflows.js";
import { registerResourceTools } from "./tools/resources.js";

async function main(): Promise<void> {
  const apiKey = process.env["N8N_API_KEY"]; const baseUrl = process.env["N8N_BASE_URL"];
  if (!apiKey || !baseUrl) { console.error("Error: N8N_API_KEY and N8N_BASE_URL are required"); process.exit(1); }
  const client = new N8nClient({ apiKey, baseUrl, timeoutMs: process.env["N8N_TIMEOUT_MS"] ? parseInt(process.env["N8N_TIMEOUT_MS"], 10) : undefined });
  const server = new McpServer({ name: "@shinkofa/mcp-n8n", version: "1.0.0" });
  registerWorkflowTools(server, client); registerResourceTools(server, client);
  await server.connect(new StdioServerTransport());
}
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
