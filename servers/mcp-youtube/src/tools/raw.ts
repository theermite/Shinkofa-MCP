import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient } from "../lib/client.js";
import { RawApiCallSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerRawTool(server: McpServer, client: YouTubeClient): void {
  server.tool("raw_api_call", "Call any YouTube Data API v3 endpoint directly. Use for: thumbnails, watermarks, channelSections, videoCategories, i18nLanguages, i18nRegions, members, membershipsLevels, captions upload, activities, abuseReports.", RawApiCallSchema.shape, async (params) =>
    withErrorHandler(async () => toolResult(await client.callApi(params.method as "GET" | "POST" | "PUT" | "DELETE", params.path, params.body ?? undefined, params.query as Record<string, string | number | boolean | string[] | undefined> | undefined)))
  );
}
