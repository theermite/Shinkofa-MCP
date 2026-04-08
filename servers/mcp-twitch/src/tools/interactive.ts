/**
 * Interactive tools — polls, predictions, raids, ads.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TwitchClient } from "../lib/client.js";
import {
  GetPollsSchema, CreatePollSchema, EndPollSchema,
  GetPredictionsSchema, CreatePredictionSchema, EndPredictionSchema,
  StartRaidSchema, CancelRaidSchema,
  StartCommercialSchema, GetAdScheduleSchema, SnoozeAdSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerInteractiveTools(server: McpServer, client: TwitchClient): void {
  // Polls
  server.tool("get_polls", "Get polls for a channel", GetPollsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/polls", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("create_poll", "Create a poll on a channel", CreatePollSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/polls", p as Record<string, unknown>));
  });

  server.tool("end_poll", "End a poll (terminate or archive)", EndPollSchema.shape, async (p) => {
    return toolResult(await client.callApi("PATCH", "/polls", p as Record<string, unknown>));
  });

  // Predictions
  server.tool("get_predictions", "Get predictions for a channel", GetPredictionsSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/predictions", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("create_prediction", "Create a prediction on a channel", CreatePredictionSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/predictions", p as Record<string, unknown>));
  });

  server.tool("end_prediction", "End a prediction (resolve, cancel, or lock)", EndPredictionSchema.shape, async (p) => {
    return toolResult(await client.callApi("PATCH", "/predictions", p as Record<string, unknown>));
  });

  // Raids
  server.tool("start_raid", "Start a raid to another channel", StartRaidSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/raids", undefined, p as Record<string, string | number | boolean | string[] | undefined>));
  });

  server.tool("cancel_raid", "Cancel an active raid", CancelRaidSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", "/raids", undefined, { broadcaster_id: p.broadcaster_id }));
  });

  // Ads
  server.tool("start_commercial", "Start a commercial break", StartCommercialSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/channels/commercial", p as Record<string, unknown>));
  });

  server.tool("get_ad_schedule", "Get ad schedule for a broadcaster", GetAdScheduleSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/channels/ads", undefined, { broadcaster_id: p.broadcaster_id }));
  });

  server.tool("snooze_ad", "Snooze the next scheduled ad by 5 minutes", SnoozeAdSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/channels/ads/schedule/snooze", undefined, { broadcaster_id: p.broadcaster_id }));
  });
}
