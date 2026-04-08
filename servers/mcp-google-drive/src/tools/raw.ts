import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DriveClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: DriveClient): void {
  server.tool(
    "drive_api_request",
    "Call any Google Drive API v3 endpoint directly. Use for: revisions, comments, replies, changes, about, drives, and any other uncovered endpoint.",
    RawApiCallSchema.shape,
    async (params) => {
      return withErrorHandler(async () =>
        toolResult(await client.callApi(
          params.method,
          params.path,
          params.body ?? undefined,
          params.query as Record<string, string | number | boolean | undefined> | undefined,
        ))
      );
    },
  );
}
