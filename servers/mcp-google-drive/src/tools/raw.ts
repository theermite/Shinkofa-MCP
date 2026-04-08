import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DriveClient, DriveError } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, toolError } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: DriveClient): void {
  server.tool(
    "drive_api_request",
    "Call any Google Drive API v3 endpoint directly. Use for: revisions, comments, replies, changes, about, drives, and any other uncovered endpoint.",
    RawApiCallSchema.shape,
    async (params) => {
      try {
        return toolResult(await client.callApi(
          params.method,
          params.path,
          params.body ?? undefined,
          params.query as Record<string, string | number | boolean | undefined> | undefined,
        ));
      } catch (error) {
        if (error instanceof DriveError) return toolError(`Drive error ${error.code}: ${error.description}`);
        throw error;
      }
    },
  );
}
