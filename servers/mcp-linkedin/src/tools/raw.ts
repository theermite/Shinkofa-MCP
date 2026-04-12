import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LinkedInClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTools(
  server: McpServer,
  client: LinkedInClient,
) {
  server.tool(
    "raw_api_call",
    "Execute a raw LinkedIn REST API call (escape hatch for unsupported endpoints)",
    RawApiCallSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        switch (p.method) {
          case "GET": {
            const data = await client.get(p.path);
            return toolResult(data);
          }
          case "POST": {
            const data = await client.post(
              p.path,
              p.body as Record<string, unknown>,
            );
            return toolResult(data);
          }
          case "DELETE": {
            await client.del(p.path);
            return toolResult(undefined);
          }
          default: {
            const data = await client.post(
              p.path,
              p.body as Record<string, unknown>,
            );
            return toolResult(data);
          }
        }
      }),
  );
}
