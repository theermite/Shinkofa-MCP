import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TailscaleClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTools(server: McpServer, client: TailscaleClient) {
  server.tool(
    "raw_api_call",
    "Escape hatch: call any Tailscale API v2 endpoint directly",
    RawApiCallSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const result = await client.request<unknown>(p.method, p.path, p.body);
        return toolResult(result);
      }),
  );
}
