#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { connectTransport } from "@shinkofa/mcp-shared";
import { YouTubeClient } from "./lib/client.js";
import { registerChannelTools } from "./tools/channels.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerLiveTools } from "./tools/live.js";
import { registerRawTool } from "./tools/raw.js";
import { registerSearchTools } from "./tools/search.js";
import { registerVideoTools } from "./tools/videos.js";

async function main(): Promise<void> {
  const client = new YouTubeClient({
    apiKey: process.env.YOUTUBE_API_KEY,
    accessToken: process.env.GOOGLE_ACCESS_TOKEN,
    apiBaseUrl: process.env.YOUTUBE_API_BASE_URL,
    timeoutMs: process.env.YOUTUBE_TIMEOUT_MS ? parseInt(process.env.YOUTUBE_TIMEOUT_MS, 10) || undefined : undefined,
  });
  const server = new McpServer({ name: "@shinkofa/mcp-youtube", version: "1.0.0" });
  registerVideoTools(server, client);
  registerChannelTools(server, client);
  registerCommentTools(server, client);
  registerSearchTools(server, client);
  registerLiveTools(server, client);
  registerRawTool(server, client);
  await connectTransport(server);
}
main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
