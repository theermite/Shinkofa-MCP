/**
 * Filter tools — source filter management.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OBSClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerFilterTools(server: McpServer, obs: OBSClient): void {
  server.tool(
    "obs-get-source-filter-list",
    "List filters on a source",
    {
      sourceName: z.string().optional(),
      sourceUuid: z.string().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetSourceFilterList", args)));
    },
  );

  server.tool(
    "obs-get-source-filter",
    "Get a specific filter",
    {
      sourceName: z.string().optional(),
      sourceUuid: z.string().optional(),
      filterName: z.string(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("GetSourceFilter", args)));
    },
  );

  server.tool(
    "obs-create-source-filter",
    "Add a filter to a source",
    {
      sourceName: z.string().optional(),
      sourceUuid: z.string().optional(),
      filterName: z.string(),
      filterKind: z.string(),
      filterSettings: z.record(z.any()).optional(),
      filterIndex: z.number().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("CreateSourceFilter", args)));
    },
  );

  server.tool(
    "obs-set-source-filter-settings",
    "Update filter settings",
    {
      sourceName: z.string().optional(),
      sourceUuid: z.string().optional(),
      filterName: z.string(),
      filterSettings: z.record(z.any()),
      overlay: z.boolean().optional(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetSourceFilterSettings", args)));
    },
  );

  server.tool(
    "obs-set-source-filter-enabled",
    "Enable/disable a filter",
    {
      sourceName: z.string().optional(),
      sourceUuid: z.string().optional(),
      filterName: z.string(),
      filterEnabled: z.boolean(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("SetSourceFilterEnabled", args)));
    },
  );

  server.tool(
    "obs-remove-source-filter",
    "Remove a filter",
    {
      sourceName: z.string().optional(),
      sourceUuid: z.string().optional(),
      filterName: z.string(),
    },
    async (args) => {
      return withErrorHandler(async () => toolResult(await obs.call("RemoveSourceFilter", args)));
    },
  );

  server.tool("obs-get-filter-kind-list", "List available filter types", {}, async () => {
    return withErrorHandler(async () => toolResult(await obs.call("GetSourceFilterKindList")));
  });
}
