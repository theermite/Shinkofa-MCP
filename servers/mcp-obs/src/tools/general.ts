/**
 * General tools — version, stats, video, hotkeys, profiles, scene collections, studio mode.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OBSClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerGeneralTools(server: McpServer, obs: OBSClient): void {
  server.tool("obs-get-version", "Get OBS version and WebSocket info", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetVersion")));
  });

  server.tool("obs-get-stats", "Get OBS performance statistics (CPU, memory, FPS, render)", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetStats")));
  });

  server.tool("obs-get-video-settings", "Get video settings (resolution, FPS)", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetVideoSettings")));
  });

  server.tool("obs-set-video-settings", "Set video output settings", {
    fpsNumerator: z.number().optional(),
    fpsDenominator: z.number().optional(),
    baseWidth: z.number().optional(),
    baseHeight: z.number().optional(),
    outputWidth: z.number().optional(),
    outputHeight: z.number().optional(),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("SetVideoSettings", args)));
  });

  server.tool("obs-get-hotkey-list", "List all registered hotkeys", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetHotkeyList")));
  });

  server.tool("obs-trigger-hotkey-by-name", "Trigger a hotkey by name", {
    hotkeyName: z.string(),
  }, async ({ hotkeyName }) => {
    return withErrorHandler(async () => toolResult(await obs.call("TriggerHotkeyByName", { hotkeyName })));
  });

  server.tool("obs-get-profile-list", "List profiles", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetProfileList")));
  });

  server.tool("obs-set-current-profile", "Switch profile", {
    profileName: z.string(),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("SetCurrentProfile", args)));
  });

  server.tool("obs-get-scene-collection-list", "List scene collections", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetSceneCollectionList")));
  });

  server.tool("obs-set-current-scene-collection", "Switch scene collection", {
    sceneCollectionName: z.string(),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("SetCurrentSceneCollection", args)));
  });

  server.tool("obs-get-studio-mode", "Check if studio mode is enabled", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetStudioModeEnabled")));
  });

  server.tool("obs-set-studio-mode", "Enable/disable studio mode", {
    studioModeEnabled: z.boolean(),
  }, async (args) => {
    return withErrorHandler(async () => toolResult(await obs.call("SetStudioModeEnabled", args)));
  });
}
