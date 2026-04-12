#!/usr/bin/env node
/**
 * @shinkofa/mcp-ollama — MCP server for Ollama REST API.
 *
 * Provides typed tools for model management, generation, chat,
 * embeddings, and a raw_api_call fallback for 100% coverage.
 *
 * Usage:
 *   npx @shinkofa/mcp-ollama
 *
 * Or in Claude Code settings:
 *   {
 *     "mcpServers": {
 *       "ollama": {
 *         "command": "npx",
 *         "args": ["@shinkofa/mcp-ollama"],
 *         "env": { "OLLAMA_BASE_URL": "http://localhost:11434" }
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OllamaClient } from "./lib/client.js";
import { registerModelTools } from "./tools/models.js";
import { registerGenerationTools } from "./tools/generation.js";
import { registerEmbeddingTools } from "./tools/embeddings.js";
import { registerRawTools } from "./tools/raw.js";

async function main(): Promise<void> {
  const client = new OllamaClient({
    baseUrl: process.env["OLLAMA_BASE_URL"],
    timeoutMs: process.env["OLLAMA_TIMEOUT_MS"]
      ? parseInt(process.env["OLLAMA_TIMEOUT_MS"], 10) || undefined
      : undefined,
  });

  const server = new McpServer({
    name: "@shinkofa/mcp-ollama",
    version: "1.0.0",
  });

  registerModelTools(server, client);
  registerGenerationTools(server, client);
  registerEmbeddingTools(server, client);
  registerRawTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
