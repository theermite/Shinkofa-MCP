/**
 * Zod schemas for Google Calendar MCP tool inputs.
 */
import { z } from "zod";

const CalendarId = z.string().describe("Calendar ID ('primary' for main calendar)");
const EventId = z.string().describe("Event ID");

// ── Events ──

export const ListEventsSchema = z.object({
  calendarId: CalendarId,
  timeMin: z.string().optional().describe("RFC3339 lower bound (inclusive)"),
  timeMax: z.string().optional().describe("RFC3339 upper bound (exclusive)"),
  q: z.string().optional().describe("Free text search"),
  maxResults: z.number().min(1).max(2500).optional(),
  singleEvents: z.boolean().optional().describe("Expand recurring events into instances"),
  orderBy: z.enum(["startTime", "updated"]).optional().describe("Requires singleEvents=true for startTime"),
  pageToken: z.string().optional(),
  showDeleted: z.boolean().optional(),
  timeZone: z.string().optional().describe("IANA timezone"),
  updatedMin: z.string().optional().describe("RFC3339 — only events updated after this"),
});

export const GetEventSchema = z.object({
  calendarId: CalendarId,
  eventId: EventId,
  timeZone: z.string().optional().describe("IANA timezone for start/end times in the response"),
});

export const CreateEventSchema = z.object({
  calendarId: CalendarId,
  summary: z.string().describe("Event title"),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.object({
    dateTime: z.string().optional().describe("RFC3339 (for timed events)"),
    date: z.string().optional().describe("YYYY-MM-DD (for all-day events)"),
    timeZone: z.string().optional(),
  }),
  end: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  }),
  attendees: z
    .array(
      z.object({
        email: z.string(),
        optional: z.boolean().optional(),
        responseStatus: z.enum(["needsAction", "declined", "tentative", "accepted"]).optional(),
      }),
    )
    .optional(),
  recurrence: z.array(z.string()).optional().describe("RRULE strings (e.g. 'RRULE:FREQ=WEEKLY;COUNT=10')"),
  reminders: z
    .object({
      useDefault: z.boolean().optional(),
      overrides: z.array(z.object({ method: z.enum(["email", "popup"]), minutes: z.number() })).optional(),
    })
    .optional(),
  colorId: z.string().optional().describe("Color ID (1-11)"),
  visibility: z.enum(["default", "public", "private", "confidential"]).optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  conferenceData: z.record(z.unknown()).optional().describe("Google Meet / conference info"),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
});

export const UpdateEventSchema = z.object({
  calendarId: CalendarId,
  eventId: EventId,
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z
    .object({ dateTime: z.string().optional(), date: z.string().optional(), timeZone: z.string().optional() })
    .optional(),
  end: z
    .object({ dateTime: z.string().optional(), date: z.string().optional(), timeZone: z.string().optional() })
    .optional(),
  attendees: z
    .array(z.object({ email: z.string(), optional: z.boolean().optional(), responseStatus: z.string().optional() }))
    .optional(),
  recurrence: z.array(z.string()).optional(),
  reminders: z
    .object({
      useDefault: z.boolean().optional(),
      overrides: z.array(z.object({ method: z.enum(["email", "popup"]), minutes: z.number() })).optional(),
    })
    .optional(),
  colorId: z.string().optional(),
  visibility: z.enum(["default", "public", "private", "confidential"]).optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
});

export const DeleteEventSchema = z.object({
  calendarId: CalendarId,
  eventId: EventId,
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
});

export const MoveEventSchema = z.object({
  calendarId: CalendarId,
  eventId: EventId,
  destination: z.string().describe("Target calendar ID"),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
});

export const QuickAddEventSchema = z.object({
  calendarId: CalendarId,
  text: z.string().describe("Quick-add text (e.g. 'Training session tomorrow 6pm for 2 hours')"),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
});

export const GetEventInstancesSchema = z.object({
  calendarId: CalendarId,
  eventId: EventId,
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
  maxResults: z.number().min(1).max(2500).optional(),
  pageToken: z.string().optional(),
  timeZone: z.string().optional(),
  showDeleted: z.boolean().optional().describe("Show deleted instances of recurring events"),
});

export const ImportEventSchema = z.object({
  calendarId: CalendarId,
  iCalUID: z.string().describe("iCalendar UID"),
  summary: z.string(),
  start: z.object({ dateTime: z.string().optional(), date: z.string().optional(), timeZone: z.string().optional() }),
  end: z.object({ dateTime: z.string().optional(), date: z.string().optional(), timeZone: z.string().optional() }),
  description: z.string().optional(),
  location: z.string().optional(),
});

// ── Calendars ──

export const GetCalendarSchema = z.object({ calendarId: CalendarId });

export const CreateCalendarSchema = z.object({
  summary: z.string().describe("Calendar name"),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
});

export const UpdateCalendarSchema = z.object({
  calendarId: CalendarId,
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
});

export const DeleteCalendarSchema = z.object({ calendarId: CalendarId });
export const ClearCalendarSchema = z.object({ calendarId: CalendarId });

// ── CalendarList ──

export const ListCalendarListSchema = z.object({
  minAccessRole: z.enum(["freeBusyReader", "owner", "reader", "writer"]).optional(),
  showDeleted: z.boolean().optional(),
  showHidden: z.boolean().optional(),
  pageToken: z.string().optional(),
});

export const GetCalendarListEntrySchema = z.object({ calendarId: CalendarId });

export const InsertCalendarListSchema = z.object({
  id: z.string().describe("Calendar ID to add"),
  colorRgbFormat: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  hidden: z.boolean().optional(),
  defaultReminders: z.array(z.object({ method: z.enum(["email", "popup"]), minutes: z.number() })).optional(),
});

export const UpdateCalendarListSchema = z.object({
  calendarId: CalendarId,
  colorRgbFormat: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  hidden: z.boolean().optional(),
  summaryOverride: z.string().optional(),
  defaultReminders: z.array(z.object({ method: z.enum(["email", "popup"]), minutes: z.number() })).optional(),
});

export const DeleteCalendarListSchema = z.object({ calendarId: CalendarId });

// ── ACL ──

export const ListAclSchema = z.object({ calendarId: CalendarId });

export const GetAclRuleSchema = z.object({ calendarId: CalendarId, ruleId: z.string() });

export const CreateAclRuleSchema = z.object({
  calendarId: CalendarId,
  role: z.enum(["none", "freeBusyReader", "reader", "writer", "owner"]),
  scope: z.object({
    type: z.enum(["default", "user", "group", "domain"]),
    value: z.string().optional().describe("Email or domain"),
  }),
  sendNotifications: z.boolean().optional(),
});

export const UpdateAclRuleSchema = z.object({
  calendarId: CalendarId,
  ruleId: z.string(),
  role: z.enum(["none", "freeBusyReader", "reader", "writer", "owner"]),
  sendNotifications: z.boolean().optional(),
});

export const DeleteAclRuleSchema = z.object({ calendarId: CalendarId, ruleId: z.string() });

// ── FreeBusy ──

export const FreeBusyQuerySchema = z.object({
  timeMin: z.string().describe("RFC3339"),
  timeMax: z.string().describe("RFC3339"),
  timeZone: z.string().optional(),
  items: z.array(z.object({ id: z.string() })).describe("Calendar IDs to query"),
  groupExpansionMax: z.number().int().optional().describe("Max group members to expand (1-100)"),
  calendarExpansionMax: z.number().int().optional().describe("Max calendars to expand (1-50)"),
});

// ── Settings ──

export const GetSettingSchema = z.object({ setting: z.string().describe("Setting key") });

// ── Raw ──

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("API path (e.g. '/calendars/primary/events')"),
  body: z.record(z.unknown()).optional(),
  query: z.record(z.string()).optional(),
});
