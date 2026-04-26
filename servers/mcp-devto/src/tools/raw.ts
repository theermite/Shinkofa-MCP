import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DevtoClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTools(server: McpServer, client: DevtoClient): void {
  server.tool(
    "raw_api_call",
    "Make a raw API call to any DEV.to endpoint (100% coverage fallback)",
    RawApiCallSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        switch (p.method) {
          case "GET":
            return toolResult(await client.get(p.path));
          case "POST":
            return toolResult(await client.post(p.path, p.body));
          case "PUT":
            return toolResult(await client.put(p.path, p.body));
          default:
            return toolResult(await client.get(p.path));
        }
      }),
  );
}
