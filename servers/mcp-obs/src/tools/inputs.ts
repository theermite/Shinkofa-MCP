/**
 * Input tools — sources + audio controls.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OBSClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerInputTools(server: McpServer, obs: OBSClient): void {
  // ===== Inputs / Sources =====

  server.tool(
    "obs-get-input-list",
    "List all inputs/sources",
    {
      inputKind: z.string().optional().describe("Filter by type, e.g. browser_source, ffmpeg_source"),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetInputList", args)));
    },
  );

  server.tool(
    "obs-get-input-kind-list",
    "List available input types",
    {
      unversioned: z.boolean().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetInputKindList", args)));
    },
  );

  server.tool(
    "obs-get-input-settings",
    "Get settings of an input",
    {
      inputName: z.string().optional(),
      inputUuid: z.string().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetInputSettings", args)));
    },
  );

  server.tool(
    "obs-set-input-settings",
    "Update input settings",
    {
      inputName: z.string().optional(),
      inputUuid: z.string().optional(),
      inputSettings: z.record(z.any()).describe("Settings object (depends on input type)"),
      overlay: z.boolean().optional().describe("true = merge with existing, false = replace all"),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetInputSettings", args)));
    },
  );

  server.tool(
    "obs-create-input",
    "Create a new input/source",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
      inputName: z.string(),
      inputKind: z.string().describe("e.g. browser_source, ffmpeg_source, image_source"),
      inputSettings: z.record(z.any()).optional(),
      sceneItemEnabled: z.boolean().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("CreateInput", args)));
    },
  );

  server.tool(
    "obs-remove-input",
    "Remove an input (and all its scene items)",
    {
      inputName: z.string().optional(),
      inputUuid: z.string().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("RemoveInput", args)));
    },
  );

  server.tool(
    "obs-set-input-name",
    "Rename an input",
    {
      inputName: z.string().optional(),
      inputUuid: z.string().optional(),
      newInputName: z.string(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetInputName", args)));
    },
  );

  // ===== Audio =====

  server.tool(
    "obs-get-input-mute",
    "Get mute state of an input",
    {
      inputName: z.string().optional(),
      inputUuid: z.string().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetInputMute", args)));
    },
  );

  server.tool(
    "obs-set-input-mute",
    "Set mute state",
    {
      inputName: z.string().optional(),
      inputUuid: z.string().optional(),
      inputMuted: z.boolean(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetInputMute", args)));
    },
  );

  server.tool(
    "obs-toggle-input-mute",
    "Toggle mute",
    {
      inputName: z.string().optional(),
      inputUuid: z.string().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("ToggleInputMute", args)));
    },
  );

  server.tool(
    "obs-get-input-volume",
    "Get volume of an input",
    {
      inputName: z.string().optional(),
      inputUuid: z.string().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetInputVolume", args)));
    },
  );

  server.tool(
    "obs-set-input-volume",
    "Set volume (dB or multiplier)",
    {
      inputName: z.string().optional(),
      inputUuid: z.string().optional(),
      inputVolumeDb: z.number().optional(),
      inputVolumeMul: z.number().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetInputVolume", args)));
    },
  );

  server.tool("obs-get-special-inputs", "Get special inputs (desktop audio, mic, etc.)", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetSpecialInputs")));
  });
}
