import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GoogleCalendarClient } from "../lib/client.js";
import { ListEventsSchema, GetEventSchema, CreateEventSchema, UpdateEventSchema, DeleteEventSchema, MoveEventSchema, QuickAddEventSchema, GetEventInstancesSchema, ImportEventSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerEventTools(server: McpServer, client: GoogleCalendarClient): void {
  server.tool("list_events", "List events from a calendar (with time range, search, etc.)", ListEventsSchema.shape, async (p) => {
    const { calendarId, ...query } = p;
    return toolResult(await client.callApi("GET", `/calendars/${encodeURIComponent(calendarId)}/events`, undefined, query as Record<string, string | number | boolean | undefined>));
  });

  server.tool("get_event", "Get a specific event", GetEventSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/calendars/${encodeURIComponent(p.calendarId)}/events/${p.eventId}`, undefined, p.timeZone ? { timeZone: p.timeZone } : undefined));
  });

  server.tool("create_event", "Create a calendar event (timed or all-day, with attendees, recurrence, reminders)", CreateEventSchema.shape, async (p) => {
    const { calendarId, sendUpdates, ...body } = p;
    return toolResult(await client.callApi("POST", `/calendars/${encodeURIComponent(calendarId)}/events`, body, sendUpdates ? { sendUpdates } : undefined));
  });

  server.tool("update_event", "Update an existing event (partial update via PATCH)", UpdateEventSchema.shape, async (p) => {
    const { calendarId, eventId, sendUpdates, ...body } = p;
    return toolResult(await client.callApi("PATCH", `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, body, sendUpdates ? { sendUpdates } : undefined));
  });

  server.tool("delete_event", "Delete an event", DeleteEventSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/calendars/${encodeURIComponent(p.calendarId)}/events/${p.eventId}`, undefined, p.sendUpdates ? { sendUpdates: p.sendUpdates } : undefined));
  });

  server.tool("move_event", "Move an event to a different calendar", MoveEventSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/calendars/${encodeURIComponent(p.calendarId)}/events/${p.eventId}/move`, undefined, { destination: p.destination, ...(p.sendUpdates ? { sendUpdates: p.sendUpdates } : {}) }));
  });

  server.tool("quick_add_event", "Create an event from natural language text (e.g. 'Training tomorrow 6pm')", QuickAddEventSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/calendars/${encodeURIComponent(p.calendarId)}/events/quickAdd`, undefined, { text: p.text, ...(p.sendUpdates ? { sendUpdates: p.sendUpdates } : {}) }));
  });

  server.tool("get_event_instances", "Get instances of a recurring event", GetEventInstancesSchema.shape, async (p) => {
    const { calendarId, eventId, ...query } = p;
    return toolResult(await client.callApi("GET", `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}/instances`, undefined, query as Record<string, string | number | boolean | undefined>));
  });

  server.tool("import_event", "Import an event (by iCalendar UID, won't duplicate)", ImportEventSchema.shape, async (p) => {
    const { calendarId, ...body } = p;
    return toolResult(await client.callApi("POST", `/calendars/${encodeURIComponent(calendarId)}/events/import`, body));
  });
}
