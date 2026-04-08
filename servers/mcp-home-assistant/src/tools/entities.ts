import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HAClient } from "../lib/client.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";
import { z } from "zod";

const EntityId = z.string().describe("Entity ID (e.g. 'light.living_room')");

export function registerEntityTools(server: McpServer, client: HAClient): void {
  server.tool("list_states", "List all entity states (can be 300+ items)", { domain: z.string().optional().describe("Filter by domain (e.g. 'light', 'switch', 'sensor')") }, async (p) => {
    return withErrorHandler(async () => {
      const states = await client.callApi<Array<{ entity_id: string }>>("GET", "/states");
      if (p.domain) {
        const prefix = p.domain + ".";
        return toolResult(states.filter((s: { entity_id: string }) => s.entity_id.startsWith(prefix)));
      }
      return toolResult(states);
    });
  });

  server.tool("get_state", "Get state of a specific entity", { entity_id: EntityId }, async (p) => {
    return withErrorHandler(async () => toolResult(await client.callApi("GET", `/states/${p.entity_id}`)));
  });

  server.tool("set_state", "Set/update an entity state record (WARNING: does NOT control physical devices — use call_service for that)", { entity_id: EntityId, state: z.string().describe("New state value"), attributes: z.record(z.unknown()).optional() }, async (p) => {
    return withErrorHandler(async () => toolResult(await client.callApi("POST", `/states/${p.entity_id}`, { state: p.state, attributes: p.attributes })));
  });

  server.tool("list_services", "List all available services by domain", {}, async () => {
    return withErrorHandler(async () => toolResult(await client.callApi("GET", "/services")));
  });

  server.tool("call_service", "Call a Home Assistant service. Common: domain='light' service='turn_on', domain='scene' service='turn_on', domain='automation' service='trigger', domain='script' service='turn_on', domain='climate' service='set_temperature'", { domain: z.string().describe("Service domain (light, switch, scene, etc.)"), service: z.string().describe("Service name (turn_on, turn_off, toggle, etc.)"), entity_id: EntityId.optional().describe("Entity to target (e.g. 'light.living_room')"), data: z.record(z.unknown()).optional().describe("Service call data payload") }, async (p) => {
    return withErrorHandler(async () => {
      const body: Record<string, unknown> = { ...p.data };
      if (p.entity_id) body.entity_id = p.entity_id;
      return toolResult(await client.callApi("POST", `/services/${p.domain}/${p.service}`, body));
    });
  });

  server.tool("list_events", "List all event types", {}, async () => {
    return withErrorHandler(async () => toolResult(await client.callApi("GET", "/events")));
  });

  server.tool("fire_event", "Fire a custom event", { event_type: z.string().describe("Event type to fire (e.g. 'custom_event')"), event_data: z.record(z.unknown()).optional().describe("Event payload data") }, async (p) => {
    return withErrorHandler(async () => toolResult(await client.callApi("POST", `/events/${p.event_type}`, p.event_data)));
  });
}
