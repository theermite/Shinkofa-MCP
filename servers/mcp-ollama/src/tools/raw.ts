import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OllamaClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTools(server: McpServer, client: OllamaClient): void {
  server.tool("get_version", "Get the Ollama server version", {}, async () =>
    withErrorHandler(async () => toolResult(await client.get("/api/version"))),
  );

  server.tool(
    "raw_api_call",
    "Make a raw API call to any Ollama endpoint (100% coverage fallback)",
    RawApiCallSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        switch (p.method) {
          case "GET":
            return toolResult(await client.get(p.path));
          case "POST":
            return toolResult(await client.post(p.path, p.body));
          case "DELETE":
            return toolResult(await client.del(p.path, p.body));
          case "HEAD":
            return toolResult(await client.head(p.path));
          case "PUT":
            return toolResult(await client.post(p.path, p.body));
          default:
            return toolResult(await client.get(p.path));
        }
      }),
  );
}
