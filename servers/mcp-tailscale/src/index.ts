#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { connectTransport } from "@shinkofa/mcp-shared";
import { TailscaleClient } from "./lib/client.js";
import { registerDeviceTools } from "./tools/devices.js";
import { registerKeyTools } from "./tools/keys.js";
import { registerPolicyTools } from "./tools/policy.js";
import { registerRawTools } from "./tools/raw.js";

const apiKey = process.env.TAILSCALE_API_KEY;
if (!apiKey) {
  console.error("TAILSCALE_API_KEY environment variable is required");
  process.exit(1);
}

const client = new TailscaleClient({
  apiKey,
  tailnet: process.env.TAILSCALE_TAILNET,
  timeoutMs: process.env.TAILSCALE_TIMEOUT_MS ? Number(process.env.TAILSCALE_TIMEOUT_MS) : undefined,
});

const server = new McpServer({
  name: "@shinkofa/mcp-tailscale",
  version: "1.0.0",
});

registerDeviceTools(server, client);
registerKeyTools(server, client);
registerPolicyTools(server, client);
registerRawTools(server, client);

await connectTransport(server);
