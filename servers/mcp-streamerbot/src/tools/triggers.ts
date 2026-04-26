/**
 * Code trigger tools — list and execute code triggers.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StreamerbotClient } from "../lib/client.js";
import { ExecuteCodeTriggerSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerTriggerTools(server: McpServer, client: StreamerbotClient): void {
  server.tool("sb-get-code-triggers", "List all available code triggers", {}, async () => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetCodeTriggers");
      return toolResult(res);
    });
  });

  server.tool(
    "sb-execute-code-trigger",
    "Execute a code trigger by name",
    ExecuteCodeTriggerSchema.shape,
    async (params) => {
      return withErrorHandler(async () => {
        const payload: Record<string, unknown> = { triggerName: params.triggerName };
        if (params.args) payload.args = params.args;
        const res = await client.sendRequest("ExecuteCodeTrigger", payload);
        return toolResult(res);
      });
    },
  );
}
