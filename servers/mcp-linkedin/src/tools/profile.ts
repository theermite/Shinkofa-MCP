import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LinkedInClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerProfileTools(
  server: McpServer,
  client: LinkedInClient,
) {
  server.tool(
    "get_me",
    "Get the authenticated LinkedIn user profile (sub, name, email, picture)",
    {},
    async () =>
      withErrorHandler(async () => {
        const data = await client.get("/v2/userinfo");
        return toolResult(data);
      }),
  );
}
