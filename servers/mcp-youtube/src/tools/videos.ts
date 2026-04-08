import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient } from "../lib/client.js";
import { VideosListSchema, VideosUpdateSchema, VideosDeleteSchema, VideosRateSchema, VideosGetRatingSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerVideoTools(server: McpServer, client: YouTubeClient): void {
  server.tool("list_videos", "List/get YouTube videos by ID, chart, or rating", VideosListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/videos", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("update_video", "Update video metadata (title, description, tags, privacy)", VideosUpdateSchema.shape, async (p) => {
    const { part, ...body } = p;
    return toolResult(await client.callApi("PUT", "/videos", body, { part: part ?? "snippet,status" }));
  });
  server.tool("delete_video", "Delete a video", VideosDeleteSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", "/videos", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("rate_video", "Like, dislike, or remove rating from a video", VideosRateSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/videos/rate", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
  server.tool("get_video_rating", "Get the authenticated user's rating on videos", VideosGetRatingSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/videos/getRating", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });
}
