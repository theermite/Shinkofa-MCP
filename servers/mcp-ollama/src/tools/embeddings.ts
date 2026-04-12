import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OllamaClient } from "../lib/client.js";
import { EmbedSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerEmbeddingTools(
  server: McpServer,
  client: OllamaClient,
): void {
  server.tool(
    "embed",
    "Generate embeddings for text or batch of texts",
    EmbedSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(await client.post("/api/embed", p)),
      ),
  );
}
