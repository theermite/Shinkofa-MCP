/**
 * Global variable tools — get all globals, get single global.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StreamerbotClient } from "../lib/client.js";
import { GetGlobalsSchema, GetGlobalSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerGlobalTools(server: McpServer, client: StreamerbotClient): void {
  server.tool("sb-get-globals", "Get all global variables", GetGlobalsSchema.shape, async (params) => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetGlobals", { persisted: params.persisted });
      return toolResult(res);
    });
  });

  server.tool("sb-get-global", "Get a single global variable by name", GetGlobalSchema.shape, async (params) => {
    return withErrorHandler(async () => {
      const res = await client.sendRequest("GetGlobal", {
        variable: params.variable,
        persisted: params.persisted,
      });
      return toolResult(res);
    });
  });
}
