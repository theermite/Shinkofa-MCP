#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DockerClient } from "./lib/client.js";
import { registerContainerTools } from "./tools/containers.js";
import { registerImageTools } from "./tools/images.js";
import { registerResourceTools } from "./tools/resources.js";
import { registerSystemTools } from "./tools/system.js";

async function main(): Promise<void> {
  const client = new DockerClient({
    socketPath: process.env.DOCKER_SOCKET,
    host: process.env.DOCKER_HOST,
    timeoutMs: process.env.DOCKER_TIMEOUT_MS ? parseInt(process.env.DOCKER_TIMEOUT_MS, 10) : undefined,
  });
  const server = new McpServer({ name: "@shinkofa/mcp-docker", version: "1.0.0" });
  registerContainerTools(server, client);
  registerImageTools(server, client);
  registerResourceTools(server, client);
  registerSystemTools(server, client);
  await server.connect(new StdioServerTransport());
}
main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
