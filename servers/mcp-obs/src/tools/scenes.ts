/**
 * Scene tools — scenes + scene items.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OBSClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerSceneTools(server: McpServer, obs: OBSClient): void {
  // ===== Scenes =====

  server.tool("obs-get-scene-list", "Get all scenes", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetSceneList")));
  });

  server.tool("obs-get-current-scene", "Get current program scene", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetCurrentProgramScene")));
  });

  server.tool(
    "obs-set-current-scene",
    "Switch to a scene",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetCurrentProgramScene", args)));
    },
  );

  server.tool(
    "obs-create-scene",
    "Create a new scene",
    {
      sceneName: z.string(),
    },
    async ({ sceneName }) => {
      return withErrorHandler(async () => toolResult(await obs.call("CreateScene", { sceneName })));
    },
  );

  server.tool(
    "obs-remove-scene",
    "Remove a scene",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("RemoveScene", args)));
    },
  );

  // ===== Scene Items =====

  server.tool(
    "obs-get-scene-items",
    "List all items in a scene",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetSceneItemList", args)));
    },
  );

  server.tool(
    "obs-get-scene-item-id",
    "Get scene item ID by source name",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
      sourceName: z.string(),
      searchOffset: z.number().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetSceneItemId", args)));
    },
  );

  server.tool(
    "obs-get-scene-item-transform",
    "Get transform (position, size, crop) of a scene item",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
      sceneItemId: z.number(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetSceneItemTransform", args)));
    },
  );

  server.tool(
    "obs-set-scene-item-transform",
    "Set transform of a scene item",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
      sceneItemId: z.number(),
      sceneItemTransform: z.record(z.any()).describe("Transform: positionX/Y, scaleX/Y, rotation, crop, bounds"),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetSceneItemTransform", args)));
    },
  );

  server.tool(
    "obs-set-scene-item-enabled",
    "Show/hide a scene item",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
      sceneItemId: z.number(),
      sceneItemEnabled: z.boolean(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetSceneItemEnabled", args)));
    },
  );

  server.tool(
    "obs-create-scene-item",
    "Add a source to a scene",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
      sourceName: z.string().optional(),
      sourceUuid: z.string().optional(),
      sceneItemEnabled: z.boolean().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("CreateSceneItem", args)));
    },
  );

  server.tool(
    "obs-remove-scene-item",
    "Remove a scene item",
    {
      sceneName: z.string().optional(),
      sceneUuid: z.string().optional(),
      sceneItemId: z.number(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("RemoveSceneItem", args)));
    },
  );
}
