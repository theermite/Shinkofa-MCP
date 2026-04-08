import { describe, it, expect } from "vitest";
import {
  ListEventsSchema, CreateEventSchema, UpdateEventSchema, DeleteEventSchema, MoveEventSchema, QuickAddEventSchema,
  GetCalendarSchema, CreateCalendarSchema, UpdateCalendarSchema,
  ListCalendarListSchema, InsertCalendarListSchema,
  CreateAclRuleSchema, UpdateAclRuleSchema,
  FreeBusyQuerySchema, GetSettingSchema, RawApiCallSchema,
} from "../src/lib/schemas.js";

describe("Event schemas", () => {
  it("list events with time range", () => { expect(ListEventsSchema.safeParse({ calendarId: "primary", timeMin: "2026-03-14T00:00:00Z", timeMax: "2026-03-21T00:00:00Z", singleEvents: true, orderBy: "startTime" }).success).toBe(true); });
  it("create timed event", () => { expect(CreateEventSchema.safeParse({ calendarId: "primary", summary: "Training HoK", start: { dateTime: "2026-03-20T18:00:00+02:00" }, end: { dateTime: "2026-03-20T20:00:00+02:00" } }).success).toBe(true); });
  it("create all-day event", () => { expect(CreateEventSchema.safeParse({ calendarId: "primary", summary: "Day off", start: { date: "2026-03-25" }, end: { date: "2026-03-26" } }).success).toBe(true); });
  it("create recurring event", () => { expect(CreateEventSchema.safeParse({ calendarId: "primary", summary: "Weekly training", start: { dateTime: "2026-03-20T18:00:00Z" }, end: { dateTime: "2026-03-20T19:00:00Z" }, recurrence: ["RRULE:FREQ=WEEKLY;COUNT=10"] }).success).toBe(true); });
  it("create event with attendees", () => { expect(CreateEventSchema.safeParse({ calendarId: "primary", summary: "Team meeting", start: { dateTime: "2026-03-20T10:00:00Z" }, end: { dateTime: "2026-03-20T11:00:00Z" }, attendees: [{ email: "ange@shinkofa.com" }] }).success).toBe(true); });
  it("update event", () => { expect(UpdateEventSchema.safeParse({ calendarId: "primary", eventId: "abc123", summary: "Updated title" }).success).toBe(true); });
  it("delete event", () => { expect(DeleteEventSchema.safeParse({ calendarId: "primary", eventId: "abc123", sendUpdates: "all" }).success).toBe(true); });
  it("move event", () => { expect(MoveEventSchema.safeParse({ calendarId: "primary", eventId: "abc", destination: "secondary_cal_id" }).success).toBe(true); });
  it("quick add", () => { expect(QuickAddEventSchema.safeParse({ calendarId: "primary", text: "Stream Dofus Touch tomorrow 8pm for 3 hours" }).success).toBe(true); });
});

describe("Calendar schemas", () => {
  it("get", () => { expect(GetCalendarSchema.safeParse({ calendarId: "primary" }).success).toBe(true); });
  it("create", () => { expect(CreateCalendarSchema.safeParse({ summary: "Esport Calendar", timeZone: "Europe/Madrid" }).success).toBe(true); });
  it("update", () => { expect(UpdateCalendarSchema.safeParse({ calendarId: "cal123", summary: "Updated" }).success).toBe(true); });
});

describe("CalendarList schemas", () => {
  it("list", () => { expect(ListCalendarListSchema.safeParse({ minAccessRole: "owner" }).success).toBe(true); });
  it("insert", () => { expect(InsertCalendarListSchema.safeParse({ id: "someone@gmail.com" }).success).toBe(true); });
});

describe("ACL schemas", () => {
  it("create rule", () => { expect(CreateAclRuleSchema.safeParse({ calendarId: "primary", role: "reader", scope: { type: "user", value: "ange@shinkofa.com" } }).success).toBe(true); });
  it("update rule", () => { expect(UpdateAclRuleSchema.safeParse({ calendarId: "primary", ruleId: "user:ange@shinkofa.com", role: "writer" }).success).toBe(true); });
});

describe("FreeBusy schema", () => {
  it("query", () => { expect(FreeBusyQuerySchema.safeParse({ timeMin: "2026-03-14T00:00:00Z", timeMax: "2026-03-15T00:00:00Z", items: [{ id: "primary" }] }).success).toBe(true); });
});

describe("Other schemas", () => {
  it("get setting", () => { expect(GetSettingSchema.safeParse({ setting: "timezone" }).success).toBe(true); });
  it("raw call", () => { expect(RawApiCallSchema.safeParse({ method: "POST", path: "/channels/stop", body: { id: "ch123", resourceId: "res456" } }).success).toBe(true); });
});
