import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OllamaClient } from "../lib/client.js";
import { ChatSchema, GenerateSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerGenerationTools(server: McpServer, client: OllamaClient): void {
  server.tool("generate", "Generate a completion from a prompt (non-streaming)", GenerateSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.post("/api/generate", { ...p, stream: false }))),
  );

  server.tool("chat", "Chat completion with message history (non-streaming)", ChatSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.post("/api/chat", { ...p, stream: false }))),
  );
}
