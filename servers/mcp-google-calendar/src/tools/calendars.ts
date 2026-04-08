import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GoogleCalendarClient } from "../lib/client.js";
import { GetCalendarSchema, CreateCalendarSchema, UpdateCalendarSchema, DeleteCalendarSchema, ClearCalendarSchema, ListCalendarListSchema, GetCalendarListEntrySchema, InsertCalendarListSchema, UpdateCalendarListSchema, DeleteCalendarListSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerCalendarTools(server: McpServer, client: GoogleCalendarClient): void {
  // Calendars
  server.tool("get_calendar", "Get calendar metadata", GetCalendarSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/calendars/${encodeURIComponent(p.calendarId)}`));
  });

  server.tool("create_calendar", "Create a new secondary calendar", CreateCalendarSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/calendars", p as Record<string, unknown>));
  });

  server.tool("update_calendar", "Update a calendar's metadata", UpdateCalendarSchema.shape, async (p) => {
    const { calendarId, ...body } = p;
    return toolResult(await client.callApi("PATCH", `/calendars/${encodeURIComponent(calendarId)}`, body));
  });

  server.tool("delete_calendar", "Delete a secondary calendar", DeleteCalendarSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/calendars/${encodeURIComponent(p.calendarId)}`));
  });

  server.tool("clear_calendar", "Clear all events from a calendar", ClearCalendarSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", `/calendars/${encodeURIComponent(p.calendarId)}/clear`));
  });

  // CalendarList
  server.tool("list_calendar_list", "List calendars on the user's calendar list", ListCalendarListSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/users/me/calendarList", undefined, p as Record<string, string | number | boolean | undefined>));
  });

  server.tool("get_calendar_list_entry", "Get a calendar list entry", GetCalendarListEntrySchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/users/me/calendarList/${encodeURIComponent(p.calendarId)}`));
  });

  server.tool("insert_calendar_list", "Add a calendar to the user's list", InsertCalendarListSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/users/me/calendarList", p as Record<string, unknown>));
  });

  server.tool("update_calendar_list_entry", "Update a calendar list entry (colors, visibility, reminders)", UpdateCalendarListSchema.shape, async (p) => {
    const { calendarId, ...body } = p;
    return toolResult(await client.callApi("PATCH", `/users/me/calendarList/${encodeURIComponent(calendarId)}`, body));
  });

  server.tool("delete_calendar_list_entry", "Remove a calendar from the user's list", DeleteCalendarListSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/users/me/calendarList/${encodeURIComponent(p.calendarId)}`));
  });
}
