#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { YouTubeClient } from "./lib/client.js";
import { registerVideoTools } from "./tools/videos.js";
import { registerChannelTools } from "./tools/channels.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerSearchTools } from "./tools/search.js";
import { registerLiveTools } from "./tools/live.js";
import { registerRawTool } from "./tools/raw.js";

async function main(): Promise<void> {
  const client = new YouTubeClient({ apiKey: process.env["YOUTUBE_API_KEY"], accessToken: process.env["GOOGLE_ACCESS_TOKEN"], apiBaseUrl: process.env["YOUTUBE_API_BASE_URL"], timeoutMs: process.env["YOUTUBE_TIMEOUT_MS"] ? parseInt(process.env["YOUTUBE_TIMEOUT_MS"], 10) || undefined : undefined });
  const server = new McpServer({ name: "@shinkofa/mcp-youtube", version: "1.0.0" });
  registerVideoTools(server, client); registerChannelTools(server, client); registerCommentTools(server, client); registerSearchTools(server, client); registerLiveTools(server, client); registerRawTool(server, client);
  await server.connect(new StdioServerTransport());
}
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
