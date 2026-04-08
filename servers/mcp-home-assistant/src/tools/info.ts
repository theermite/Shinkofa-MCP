import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HAClient, HAError } from "../lib/client.js";
import { toolResult, toolError } from "../lib/utils.js";
import { z } from "zod";

export function registerInfoTools(server: McpServer, client: HAClient): void {
  server.tool("get_config", "Get Home Assistant configuration", {}, async () => { return toolResult(await client.callApi("GET", "/config")); });
  server.tool("get_discovery_info", "Get discovery information", {}, async () => { return toolResult(await client.callApi("GET", "/discovery_info")); });
  server.tool("check_config", "Validate Home Assistant configuration", {}, async () => { return toolResult(await client.callApi("POST", "/config/core/check_config")); });
  server.tool("get_error_log", "Get error log", {}, async () => { return toolResult(await client.callApi("GET", "/error_log")); });
  server.tool("render_template", "Render a Jinja2 template", { template: z.string().describe("Jinja2 template string") }, async (p) => {
    return toolResult(await client.callApi("POST", "/template", { template: p.template }));
  });
  server.tool("get_history", "Get state history for entities", { timestamp: z.string().optional().describe("ISO 8601 start time"), entity_id: z.string().optional().describe("Filter by entity"), end_time: z.string().optional(), minimal_response: z.boolean().optional() }, async (p) => {
    const path = p.timestamp ? `/history/period/${p.timestamp}` : "/history/period";
    const query: Record<string, string | number | boolean | undefined> = {};
    if (p.entity_id) query.filter_entity_id = p.entity_id;
    if (p.end_time) query.end_time = p.end_time;
    if (p.minimal_response) query.minimal_response = p.minimal_response;
    return toolResult(await client.callApi("GET", path));
  });
  server.tool("get_logbook", "Get logbook entries", { timestamp: z.string().optional().describe("ISO 8601 start time"), entity_id: z.string().optional(), end_time: z.string().optional() }, async (p) => {
    const path = p.timestamp ? `/logbook/${p.timestamp}` : "/logbook";
    return toolResult(await client.callApi("GET", path));
  });
  server.tool("list_calendars", "List all calendar entities", {}, async () => { return toolResult(await client.callApi("GET", "/calendars")); });
  server.tool("get_calendar_events", "Get events from a calendar", { entity_id: z.string(), start: z.string().optional().describe("ISO 8601"), end: z.string().optional().describe("ISO 8601") }, async (p) => {
    return toolResult(await client.callApi("GET", `/calendars/${p.entity_id}`));
  });
  server.tool("get_camera_image", "Get current camera image", { entity_id: z.string() }, async (p) => {
    return toolResult(await client.callApi("GET", `/camera_proxy/${p.entity_id}`));
  });

  server.tool("raw_api_call", "Call any Home Assistant API endpoint directly", { method: z.enum(["GET", "POST", "PUT", "DELETE"]), path: z.string(), body: z.record(z.unknown()).optional() }, async (params) => {
    try { return toolResult(await client.callApi(params.method, params.path, params.body ?? undefined)); }
    catch (error) { if (error instanceof HAError) return toolError(`HA error ${error.status}: ${error.description}`); throw error; }
  });
}
