import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HAClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerInfoTools(server: McpServer, client: HAClient): void {
  server.tool("get_config", "Get Home Assistant configuration", {}, async () => {
    return withErrorHandler(async () => toolResult(await client.callApi("GET", "/config")));
  });

  server.tool("get_discovery_info", "Get discovery information", {}, async () => {
    return withErrorHandler(async () => toolResult(await client.callApi("GET", "/discovery_info")));
  });

  server.tool("check_config", "Validate Home Assistant configuration", {}, async () => {
    return withErrorHandler(async () => toolResult(await client.callApi("POST", "/config/core/check_config")));
  });

  server.tool("get_error_log", "Get error log", {}, async () => {
    return withErrorHandler(async () => toolResult(await client.callApi("GET", "/error_log")));
  });

  server.tool(
    "render_template",
    "Render a Jinja2 template (max 2000 chars, read-only state access)",
    { template: z.string().max(2000).describe("Jinja2 template string (max 2000 chars)") },
    async (p) => {
      return withErrorHandler(async () =>
        toolResult(await client.callApi("POST", "/template", { template: p.template })),
      );
    },
  );

  server.tool(
    "get_history",
    "Get state history for entities",
    {
      timestamp: z.string().optional().describe("ISO 8601 start time (e.g. '2026-04-08T00:00:00Z')"),
      entity_id: z.string().optional().describe("Filter by entity"),
      end_time: z.string().optional().describe("ISO 8601 end time"),
      minimal_response: z
        .boolean()
        .optional()
        .describe("Omit extra attributes to reduce response size — recommended for long time ranges"),
      significant_changes_only: z.boolean().optional().describe("Only return significant state changes"),
      no_attributes: z.boolean().optional().describe("Omit entity attributes to reduce response size"),
    },
    async (p) => {
      return withErrorHandler(async () => {
        const path = p.timestamp ? `/history/period/${p.timestamp}` : "/history/period";
        const query: Record<string, string | number | boolean | undefined> = {};
        if (p.entity_id) query.filter_entity_id = p.entity_id;
        if (p.end_time) query.end_time = p.end_time;
        if (p.minimal_response) query.minimal_response = p.minimal_response;
        if (p.significant_changes_only) query.significant_changes_only = p.significant_changes_only;
        if (p.no_attributes) query.no_attributes = p.no_attributes;
        return toolResult(await client.callApi("GET", path, undefined, query));
      });
    },
  );

  server.tool(
    "get_logbook",
    "Get logbook entries",
    {
      timestamp: z.string().optional().describe("ISO 8601 start time"),
      entity_id: z.string().optional().describe("Filter by entity"),
      end_time: z.string().optional().describe("ISO 8601 end time"),
    },
    async (p) => {
      return withErrorHandler(async () => {
        const path = p.timestamp ? `/logbook/${p.timestamp}` : "/logbook";
        const query: Record<string, string | number | boolean | undefined> = {};
        if (p.entity_id) query.entity = p.entity_id;
        if (p.end_time) query.end_time = p.end_time;
        return toolResult(await client.callApi("GET", path, undefined, query));
      });
    },
  );

  server.tool("list_calendars", "List all calendar entities", {}, async () => {
    return withErrorHandler(async () => toolResult(await client.callApi("GET", "/calendars")));
  });

  server.tool(
    "get_calendar_events",
    "Get events from a calendar",
    {
      entity_id: z.string(),
      start: z.string().describe("ISO 8601 start time (required by HA)"),
      end: z.string().describe("ISO 8601 end time (required by HA)"),
    },
    async (p) => {
      return withErrorHandler(async () => {
        const query: Record<string, string | number | boolean | undefined> = { start: p.start, end: p.end };
        return toolResult(await client.callApi("GET", `/calendars/${p.entity_id}`, undefined, query));
      });
    },
  );

  server.tool(
    "get_camera_image",
    "Get current camera image as base64-encoded JPEG",
    { entity_id: z.string() },
    async (p) => {
      return withErrorHandler(async () => {
        const imageData = await client.callApiRaw(`/camera_proxy/${p.entity_id}`);
        return { content: [{ type: "image" as const, data: imageData.base64, mimeType: imageData.mimeType }] };
      });
    },
  );

  server.tool(
    "raw_api_call",
    "Call any Home Assistant API endpoint directly. Warning: can trigger destructive actions (restart, etc).",
    {
      method: z.enum(["GET", "POST", "PUT", "DELETE"]),
      path: z.string(),
      body: z.record(z.unknown()).optional(),
      query: z.record(z.string()).optional().describe("Query parameters"),
    },
    async (params) => {
      return withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            params.method,
            params.path,
            params.body ?? undefined,
            params.query as Record<string, string | number | boolean | undefined> | undefined,
          ),
        ),
      );
    },
  );
}
