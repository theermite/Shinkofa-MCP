/**
 * Transition tools — transitions, screenshots, media, custom events.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OBSClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerTransitionTools(server: McpServer, obs: OBSClient): void {
  // ===== Transitions =====

  server.tool("obs-get-transition-list", "List available transitions", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetSceneTransitionList")));
  });

  server.tool("obs-get-current-transition", "Get current scene transition", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetCurrentSceneTransition")));
  });

  server.tool("obs-set-current-transition", "Set current transition", {
    transitionName: z.string().optional(),
    transitionUuid: z.string().optional(),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("SetCurrentSceneTransition", args)));
  });

  server.tool("obs-set-transition-duration", "Set transition duration (ms)", {
    transitionDuration: z.number(),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("SetCurrentSceneTransitionDuration", args)));
  });

  // ===== Screenshots =====

  server.tool("obs-get-source-screenshot", "Take a screenshot of a source (returns base64)", {
    sourceName: z.string().optional(),
    sourceUuid: z.string().optional(),
    imageFormat: z.string().default("png").describe("png, jpg, bmp"),
    imageWidth: z.number().optional(),
    imageHeight: z.number().optional(),
    imageCompressionQuality: z.number().optional(),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("GetSourceScreenshot", args)));
  });

  server.tool("obs-save-source-screenshot", "Save a screenshot to file", {
    sourceName: z.string().optional(),
    sourceUuid: z.string().optional(),
    imageFormat: z.string().default("png"),
    imageFilePath: z.string(),
    imageWidth: z.number().optional(),
    imageHeight: z.number().optional(),
    imageCompressionQuality: z.number().optional(),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("SaveSourceScreenshot", args)));
  });

  // ===== Media =====

  server.tool("obs-get-media-input-status", "Get media source playback status", {
    inputName: z.string().optional(),
    inputUuid: z.string().optional(),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("GetMediaInputStatus", args)));
  });

  server.tool("obs-trigger-media-input-action", "Control media playback (play, pause, stop, restart)", {
    inputName: z.string().optional(),
    inputUuid: z.string().optional(),
    mediaAction: z.enum([
      "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY",
      "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PAUSE",
      "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP",
      "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART",
      "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_NEXT",
      "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PREVIOUS",
    ]),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("TriggerMediaInputAction", args)));
  });

  // ===== Custom Events =====

  server.tool("obs-broadcast-custom-event", "Broadcast a custom event", {
    eventData: z.record(z.any()).describe("Custom event payload"),
  }, async ({ eventData }) => {
    return withErrorHandler(async () => toolResult(await obs.call("BroadcastCustomEvent", { eventData })));
  });
}
