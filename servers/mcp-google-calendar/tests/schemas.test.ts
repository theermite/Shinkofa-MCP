import { describe, it, expect } from "vitest";
import {
  ListEventsSchema,
  GetEventSchema,
  CreateEventSchema,
  UpdateEventSchema,
  DeleteEventSchema,
  MoveEventSchema,
  QuickAddEventSchema,
  GetEventInstancesSchema,
  ImportEventSchema,
  GetCalendarSchema,
  CreateCalendarSchema,
  UpdateCalendarSchema,
  DeleteCalendarSchema,
  ClearCalendarSchema,
  ListCalendarListSchema,
  GetCalendarListEntrySchema,
  InsertCalendarListSchema,
  UpdateCalendarListSchema,
  DeleteCalendarListSchema,
  ListAclSchema,
  GetAclRuleSchema,
  CreateAclRuleSchema,
  UpdateAclRuleSchema,
  DeleteAclRuleSchema,
  FreeBusyQuerySchema,
  GetSettingSchema,
  RawApiCallSchema,
} from "../src/lib/schemas.js";

// ── ListEventsSchema ──────────────────────────────────────────────────────────

describe("ListEventsSchema", () => {
  it("should_accept_minimal_valid_input", () => {
    expect(ListEventsSchema.safeParse({ calendarId: "primary" }).success).toBe(true);
  });

  it("should_accept_full_time_range_with_options", () => {
    expect(ListEventsSchema.safeParse({
      calendarId: "primary",
      timeMin: "2026-03-14T00:00:00Z",
      timeMax: "2026-03-21T00:00:00Z",
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    }).success).toBe(true);
  });

  it("should_accept_showDeleted_flag", () => {
    expect(ListEventsSchema.safeParse({ calendarId: "primary", showDeleted: true }).success).toBe(true);
  });

  it("should_accept_updatedMin_field", () => {
    expect(ListEventsSchema.safeParse({ calendarId: "primary", updatedMin: "2026-04-01T00:00:00Z" }).success).toBe(true);
  });

  it("should_reject_maxResults_above_2500", () => {
    expect(ListEventsSchema.safeParse({ calendarId: "primary", maxResults: 2501 }).success).toBe(false);
  });

  it("should_reject_maxResults_below_1", () => {
    expect(ListEventsSchema.safeParse({ calendarId: "primary", maxResults: 0 }).success).toBe(false);
  });

  it("should_reject_invalid_orderBy_value", () => {
    expect(ListEventsSchema.safeParse({ calendarId: "primary", orderBy: "invalid" }).success).toBe(false);
  });

  it("should_reject_missing_calendarId", () => {
    expect(ListEventsSchema.safeParse({}).success).toBe(false);
  });
});

// ── GetEventSchema ────────────────────────────────────────────────────────────

describe("GetEventSchema", () => {
  it("should_accept_calendarId_and_eventId", () => {
    expect(GetEventSchema.safeParse({ calendarId: "primary", eventId: "evt001" }).success).toBe(true);
  });

  it("should_accept_optional_timeZone", () => {
    expect(GetEventSchema.safeParse({ calendarId: "primary", eventId: "evt001", timeZone: "Europe/Madrid" }).success).toBe(true);
  });

  it("should_reject_missing_eventId", () => {
    expect(GetEventSchema.safeParse({ calendarId: "primary" }).success).toBe(false);
  });
});

// ── CreateEventSchema ─────────────────────────────────────────────────────────

describe("CreateEventSchema", () => {
  it("should_accept_timed_event", () => {
    expect(CreateEventSchema.safeParse({
      calendarId: "primary",
      summary: "Training HoK",
      start: { dateTime: "2026-03-20T18:00:00+02:00" },
      end: { dateTime: "2026-03-20T20:00:00+02:00" },
    }).success).toBe(true);
  });

  it("should_accept_all_day_event", () => {
    expect(CreateEventSchema.safeParse({
      calendarId: "primary",
      summary: "Day off",
      start: { date: "2026-03-25" },
      end: { date: "2026-03-26" },
    }).success).toBe(true);
  });

  it("should_accept_recurring_event_with_rrule", () => {
    expect(CreateEventSchema.safeParse({
      calendarId: "primary",
      summary: "Weekly training",
      start: { dateTime: "2026-03-20T18:00:00Z" },
      end: { dateTime: "2026-03-20T19:00:00Z" },
      recurrence: ["RRULE:FREQ=WEEKLY;COUNT=10"],
    }).success).toBe(true);
  });

  it("should_accept_event_with_attendees", () => {
    expect(CreateEventSchema.safeParse({
      calendarId: "primary",
      summary: "Team meeting",
      start: { dateTime: "2026-03-20T10:00:00Z" },
      end: { dateTime: "2026-03-20T11:00:00Z" },
      attendees: [{ email: "ange@shinkofa.com" }],
    }).success).toBe(true);
  });

  it("should_accept_visibility_enum_values", () => {
    for (const visibility of ["default", "public", "private", "confidential"]) {
      expect(CreateEventSchema.safeParse({
        calendarId: "primary",
        summary: "Event",
        start: { date: "2026-04-01" },
        end: { date: "2026-04-02" },
        visibility,
      }).success).toBe(true);
    }
  });

  it("should_accept_sendUpdates_enum_values", () => {
    for (const sendUpdates of ["all", "externalOnly", "none"]) {
      expect(CreateEventSchema.safeParse({
        calendarId: "primary",
        summary: "Event",
        start: { date: "2026-04-01" },
        end: { date: "2026-04-02" },
        sendUpdates,
      }).success).toBe(true);
    }
  });

  it("should_reject_invalid_visibility_value", () => {
    expect(CreateEventSchema.safeParse({
      calendarId: "primary",
      summary: "Event",
      start: { date: "2026-04-01" },
      end: { date: "2026-04-02" },
      visibility: "secret",
    }).success).toBe(false);
  });

  it("should_reject_missing_summary", () => {
    expect(CreateEventSchema.safeParse({
      calendarId: "primary",
      start: { date: "2026-04-01" },
      end: { date: "2026-04-02" },
    }).success).toBe(false);
  });

  it("should_reject_missing_start_and_end", () => {
    expect(CreateEventSchema.safeParse({ calendarId: "primary", summary: "Missing times" }).success).toBe(false);
  });
});

// ── UpdateEventSchema ─────────────────────────────────────────────────────────

describe("UpdateEventSchema", () => {
  it("should_accept_partial_update", () => {
    expect(UpdateEventSchema.safeParse({ calendarId: "primary", eventId: "abc123", summary: "Updated title" }).success).toBe(true);
  });

  it("should_accept_empty_update_with_required_fields_only", () => {
    expect(UpdateEventSchema.safeParse({ calendarId: "primary", eventId: "abc123" }).success).toBe(true);
  });

  it("should_reject_missing_eventId", () => {
    expect(UpdateEventSchema.safeParse({ calendarId: "primary" }).success).toBe(false);
  });
});

// ── DeleteEventSchema ─────────────────────────────────────────────────────────

describe("DeleteEventSchema", () => {
  it("should_accept_required_fields", () => {
    expect(DeleteEventSchema.safeParse({ calendarId: "primary", eventId: "abc123" }).success).toBe(true);
  });

  it("should_accept_sendUpdates_option", () => {
    expect(DeleteEventSchema.safeParse({ calendarId: "primary", eventId: "abc123", sendUpdates: "all" }).success).toBe(true);
  });

  it("should_reject_invalid_sendUpdates_value", () => {
    expect(DeleteEventSchema.safeParse({ calendarId: "primary", eventId: "abc123", sendUpdates: "maybe" }).success).toBe(false);
  });
});

// ── MoveEventSchema ───────────────────────────────────────────────────────────

describe("MoveEventSchema", () => {
  it("should_accept_move_with_destination", () => {
    expect(MoveEventSchema.safeParse({ calendarId: "primary", eventId: "abc", destination: "secondary_cal_id" }).success).toBe(true);
  });

  it("should_reject_missing_destination", () => {
    expect(MoveEventSchema.safeParse({ calendarId: "primary", eventId: "abc" }).success).toBe(false);
  });
});

// ── QuickAddEventSchema ───────────────────────────────────────────────────────

describe("QuickAddEventSchema", () => {
  it("should_accept_quick_add_text", () => {
    expect(QuickAddEventSchema.safeParse({ calendarId: "primary", text: "Stream Dofus Touch tomorrow 8pm for 3 hours" }).success).toBe(true);
  });

  it("should_reject_missing_text", () => {
    expect(QuickAddEventSchema.safeParse({ calendarId: "primary" }).success).toBe(false);
  });
});

// ── GetEventInstancesSchema ───────────────────────────────────────────────────

describe("GetEventInstancesSchema", () => {
  it("should_accept_required_calendarId_and_eventId", () => {
    expect(GetEventInstancesSchema.safeParse({ calendarId: "primary", eventId: "recurring_evt_id" }).success).toBe(true);
  });

  it("should_accept_showDeleted_flag", () => {
    expect(GetEventInstancesSchema.safeParse({
      calendarId: "primary",
      eventId: "recurring_evt_id",
      showDeleted: true,
    }).success).toBe(true);
  });

  it("should_accept_full_optional_fields", () => {
    expect(GetEventInstancesSchema.safeParse({
      calendarId: "primary",
      eventId: "recurring_evt_id",
      timeMin: "2026-04-01T00:00:00Z",
      timeMax: "2026-05-01T00:00:00Z",
      maxResults: 10,
      timeZone: "Europe/Madrid",
      showDeleted: false,
    }).success).toBe(true);
  });

  it("should_reject_missing_eventId", () => {
    expect(GetEventInstancesSchema.safeParse({ calendarId: "primary" }).success).toBe(false);
  });

  it("should_reject_maxResults_exceeding_2500", () => {
    expect(GetEventInstancesSchema.safeParse({ calendarId: "primary", eventId: "evt", maxResults: 9999 }).success).toBe(false);
  });
});

// ── ImportEventSchema ─────────────────────────────────────────────────────────

describe("ImportEventSchema", () => {
  it("should_accept_required_fields", () => {
    expect(ImportEventSchema.safeParse({
      calendarId: "primary",
      iCalUID: "uid-12345@example.com",
      summary: "Imported event",
      start: { dateTime: "2026-04-10T10:00:00Z" },
      end: { dateTime: "2026-04-10T11:00:00Z" },
    }).success).toBe(true);
  });

  it("should_accept_optional_description_and_location", () => {
    expect(ImportEventSchema.safeParse({
      calendarId: "primary",
      iCalUID: "uid-abc@example.com",
      summary: "Imported",
      start: { date: "2026-04-10" },
      end: { date: "2026-04-11" },
      description: "From external calendar",
      location: "Corumbela, Andalusia",
    }).success).toBe(true);
  });

  it("should_reject_missing_iCalUID", () => {
    expect(ImportEventSchema.safeParse({
      calendarId: "primary",
      summary: "Imported",
      start: { date: "2026-04-10" },
      end: { date: "2026-04-11" },
    }).success).toBe(false);
  });

  it("should_reject_missing_summary", () => {
    expect(ImportEventSchema.safeParse({
      calendarId: "primary",
      iCalUID: "uid-abc@example.com",
      start: { date: "2026-04-10" },
      end: { date: "2026-04-11" },
    }).success).toBe(false);
  });
});

// ── Calendar schemas ──────────────────────────────────────────────────────────

describe("GetCalendarSchema", () => {
  it("should_accept_calendarId", () => {
    expect(GetCalendarSchema.safeParse({ calendarId: "primary" }).success).toBe(true);
  });

  it("should_reject_missing_calendarId", () => {
    expect(GetCalendarSchema.safeParse({}).success).toBe(false);
  });
});

describe("CreateCalendarSchema", () => {
  it("should_accept_summary_only", () => {
    expect(CreateCalendarSchema.safeParse({ summary: "Esport Calendar" }).success).toBe(true);
  });

  it("should_accept_full_fields", () => {
    expect(CreateCalendarSchema.safeParse({
      summary: "Esport Calendar",
      description: "Jay's esport schedule",
      location: "Europe",
      timeZone: "Europe/Madrid",
    }).success).toBe(true);
  });

  it("should_reject_missing_summary", () => {
    expect(CreateCalendarSchema.safeParse({ timeZone: "Europe/Madrid" }).success).toBe(false);
  });
});

describe("UpdateCalendarSchema", () => {
  it("should_accept_partial_update", () => {
    expect(UpdateCalendarSchema.safeParse({ calendarId: "cal123", summary: "Updated" }).success).toBe(true);
  });

  it("should_accept_calendarId_with_no_other_fields", () => {
    expect(UpdateCalendarSchema.safeParse({ calendarId: "cal123" }).success).toBe(true);
  });

  it("should_reject_missing_calendarId", () => {
    expect(UpdateCalendarSchema.safeParse({ summary: "No id" }).success).toBe(false);
  });
});

describe("DeleteCalendarSchema", () => {
  it("should_accept_calendarId", () => {
    expect(DeleteCalendarSchema.safeParse({ calendarId: "cal-to-delete" }).success).toBe(true);
  });

  it("should_reject_missing_calendarId", () => {
    expect(DeleteCalendarSchema.safeParse({}).success).toBe(false);
  });
});

describe("ClearCalendarSchema", () => {
  it("should_accept_calendarId", () => {
    expect(ClearCalendarSchema.safeParse({ calendarId: "primary" }).success).toBe(true);
  });

  it("should_reject_missing_calendarId", () => {
    expect(ClearCalendarSchema.safeParse({}).success).toBe(false);
  });
});

// ── CalendarList schemas ──────────────────────────────────────────────────────

describe("ListCalendarListSchema", () => {
  it("should_accept_empty_object", () => {
    expect(ListCalendarListSchema.safeParse({}).success).toBe(true);
  });

  it("should_accept_minAccessRole_owner", () => {
    expect(ListCalendarListSchema.safeParse({ minAccessRole: "owner" }).success).toBe(true);
  });

  it("should_accept_all_valid_minAccessRole_values", () => {
    for (const role of ["freeBusyReader", "owner", "reader", "writer"]) {
      expect(ListCalendarListSchema.safeParse({ minAccessRole: role }).success).toBe(true);
    }
  });

  it("should_reject_invalid_minAccessRole", () => {
    expect(ListCalendarListSchema.safeParse({ minAccessRole: "admin" }).success).toBe(false);
  });

  it("should_accept_showDeleted_and_showHidden", () => {
    expect(ListCalendarListSchema.safeParse({ showDeleted: true, showHidden: false }).success).toBe(true);
  });
});

describe("GetCalendarListEntrySchema", () => {
  it("should_accept_calendarId", () => {
    expect(GetCalendarListEntrySchema.safeParse({ calendarId: "someone@gmail.com" }).success).toBe(true);
  });

  it("should_reject_missing_calendarId", () => {
    expect(GetCalendarListEntrySchema.safeParse({}).success).toBe(false);
  });
});

describe("InsertCalendarListSchema", () => {
  it("should_accept_id_only", () => {
    expect(InsertCalendarListSchema.safeParse({ id: "someone@gmail.com" }).success).toBe(true);
  });

  it("should_accept_full_fields", () => {
    expect(InsertCalendarListSchema.safeParse({
      id: "someone@gmail.com",
      colorRgbFormat: true,
      backgroundColor: "#ff0000",
      foregroundColor: "#ffffff",
      hidden: false,
      defaultReminders: [{ method: "popup", minutes: 10 }],
    }).success).toBe(true);
  });

  it("should_reject_missing_id", () => {
    expect(InsertCalendarListSchema.safeParse({ hidden: false }).success).toBe(false);
  });
});

describe("UpdateCalendarListSchema", () => {
  it("should_accept_calendarId_with_optional_fields", () => {
    expect(UpdateCalendarListSchema.safeParse({
      calendarId: "primary",
      backgroundColor: "#0000ff",
      summaryOverride: "My Calendar",
    }).success).toBe(true);
  });

  it("should_accept_defaultReminders_array", () => {
    expect(UpdateCalendarListSchema.safeParse({
      calendarId: "primary",
      defaultReminders: [{ method: "email", minutes: 30 }],
    }).success).toBe(true);
  });

  it("should_reject_missing_calendarId", () => {
    expect(UpdateCalendarListSchema.safeParse({ summaryOverride: "No id" }).success).toBe(false);
  });

  it("should_reject_invalid_reminder_method", () => {
    expect(UpdateCalendarListSchema.safeParse({
      calendarId: "primary",
      defaultReminders: [{ method: "sms", minutes: 10 }],
    }).success).toBe(false);
  });
});

describe("DeleteCalendarListSchema", () => {
  it("should_accept_calendarId", () => {
    expect(DeleteCalendarListSchema.safeParse({ calendarId: "cal@group.calendar.google.com" }).success).toBe(true);
  });

  it("should_reject_missing_calendarId", () => {
    expect(DeleteCalendarListSchema.safeParse({}).success).toBe(false);
  });
});

// ── ACL schemas ───────────────────────────────────────────────────────────────

describe("ListAclSchema", () => {
  it("should_accept_calendarId", () => {
    expect(ListAclSchema.safeParse({ calendarId: "primary" }).success).toBe(true);
  });

  it("should_reject_missing_calendarId", () => {
    expect(ListAclSchema.safeParse({}).success).toBe(false);
  });
});

describe("GetAclRuleSchema", () => {
  it("should_accept_calendarId_and_ruleId", () => {
    expect(GetAclRuleSchema.safeParse({ calendarId: "primary", ruleId: "user:ange@shinkofa.com" }).success).toBe(true);
  });

  it("should_reject_missing_ruleId", () => {
    expect(GetAclRuleSchema.safeParse({ calendarId: "primary" }).success).toBe(false);
  });

  it("should_reject_missing_calendarId", () => {
    expect(GetAclRuleSchema.safeParse({ ruleId: "user:test@test.com" }).success).toBe(false);
  });
});

describe("CreateAclRuleSchema", () => {
  it("should_accept_valid_rule", () => {
    expect(CreateAclRuleSchema.safeParse({
      calendarId: "primary",
      role: "reader",
      scope: { type: "user", value: "ange@shinkofa.com" },
    }).success).toBe(true);
  });

  it("should_accept_all_valid_roles", () => {
    for (const role of ["none", "freeBusyReader", "reader", "writer", "owner"]) {
      expect(CreateAclRuleSchema.safeParse({
        calendarId: "primary",
        role,
        scope: { type: "default" },
      }).success).toBe(true);
    }
  });

  it("should_accept_all_valid_scope_types", () => {
    for (const type of ["default", "user", "group", "domain"]) {
      expect(CreateAclRuleSchema.safeParse({
        calendarId: "primary",
        role: "reader",
        scope: { type },
      }).success).toBe(true);
    }
  });

  it("should_reject_invalid_role", () => {
    expect(CreateAclRuleSchema.safeParse({
      calendarId: "primary",
      role: "admin",
      scope: { type: "user" },
    }).success).toBe(false);
  });

  it("should_reject_missing_scope", () => {
    expect(CreateAclRuleSchema.safeParse({ calendarId: "primary", role: "reader" }).success).toBe(false);
  });
});

describe("UpdateAclRuleSchema", () => {
  it("should_accept_valid_update", () => {
    expect(UpdateAclRuleSchema.safeParse({
      calendarId: "primary",
      ruleId: "user:ange@shinkofa.com",
      role: "writer",
    }).success).toBe(true);
  });

  it("should_reject_invalid_role", () => {
    expect(UpdateAclRuleSchema.safeParse({
      calendarId: "primary",
      ruleId: "user:test@test.com",
      role: "superadmin",
    }).success).toBe(false);
  });
});

describe("DeleteAclRuleSchema", () => {
  it("should_accept_calendarId_and_ruleId", () => {
    expect(DeleteAclRuleSchema.safeParse({ calendarId: "primary", ruleId: "user:test@test.com" }).success).toBe(true);
  });

  it("should_reject_missing_ruleId", () => {
    expect(DeleteAclRuleSchema.safeParse({ calendarId: "primary" }).success).toBe(false);
  });
});

// ── FreeBusyQuerySchema ───────────────────────────────────────────────────────

describe("FreeBusyQuerySchema", () => {
  it("should_accept_minimal_required_fields", () => {
    expect(FreeBusyQuerySchema.safeParse({
      timeMin: "2026-03-14T00:00:00Z",
      timeMax: "2026-03-15T00:00:00Z",
      items: [{ id: "primary" }],
    }).success).toBe(true);
  });

  it("should_accept_multiple_calendar_items", () => {
    expect(FreeBusyQuerySchema.safeParse({
      timeMin: "2026-04-01T00:00:00Z",
      timeMax: "2026-04-02T00:00:00Z",
      items: [{ id: "primary" }, { id: "other@gmail.com" }],
    }).success).toBe(true);
  });

  it("should_accept_groupExpansionMax", () => {
    expect(FreeBusyQuerySchema.safeParse({
      timeMin: "2026-04-01T00:00:00Z",
      timeMax: "2026-04-02T00:00:00Z",
      items: [{ id: "primary" }],
      groupExpansionMax: 50,
    }).success).toBe(true);
  });

  it("should_accept_calendarExpansionMax", () => {
    expect(FreeBusyQuerySchema.safeParse({
      timeMin: "2026-04-01T00:00:00Z",
      timeMax: "2026-04-02T00:00:00Z",
      items: [{ id: "primary" }],
      calendarExpansionMax: 25,
    }).success).toBe(true);
  });

  it("should_accept_optional_timeZone", () => {
    expect(FreeBusyQuerySchema.safeParse({
      timeMin: "2026-04-01T00:00:00Z",
      timeMax: "2026-04-02T00:00:00Z",
      items: [{ id: "primary" }],
      timeZone: "Europe/Madrid",
    }).success).toBe(true);
  });

  it("should_reject_missing_timeMin", () => {
    expect(FreeBusyQuerySchema.safeParse({
      timeMax: "2026-04-02T00:00:00Z",
      items: [{ id: "primary" }],
    }).success).toBe(false);
  });

  it("should_reject_missing_items", () => {
    expect(FreeBusyQuerySchema.safeParse({
      timeMin: "2026-04-01T00:00:00Z",
      timeMax: "2026-04-02T00:00:00Z",
    }).success).toBe(false);
  });

  it("should_reject_non_integer_groupExpansionMax", () => {
    expect(FreeBusyQuerySchema.safeParse({
      timeMin: "2026-04-01T00:00:00Z",
      timeMax: "2026-04-02T00:00:00Z",
      items: [{ id: "primary" }],
      groupExpansionMax: 5.5,
    }).success).toBe(false);
  });
});

// ── GetSettingSchema ──────────────────────────────────────────────────────────

describe("GetSettingSchema", () => {
  it("should_accept_setting_key", () => {
    expect(GetSettingSchema.safeParse({ setting: "timezone" }).success).toBe(true);
  });

  it("should_accept_any_string_setting_key", () => {
    expect(GetSettingSchema.safeParse({ setting: "locale" }).success).toBe(true);
    expect(GetSettingSchema.safeParse({ setting: "dateFieldOrder" }).success).toBe(true);
  });

  it("should_reject_missing_setting", () => {
    expect(GetSettingSchema.safeParse({}).success).toBe(false);
  });
});

// ── RawApiCallSchema ──────────────────────────────────────────────────────────

describe("RawApiCallSchema", () => {
  it("should_accept_POST_with_body", () => {
    expect(RawApiCallSchema.safeParse({
      method: "POST",
      path: "/channels/stop",
      body: { id: "ch123", resourceId: "res456" },
    }).success).toBe(true);
  });

  it("should_accept_GET_without_body", () => {
    expect(RawApiCallSchema.safeParse({ method: "GET", path: "/colors" }).success).toBe(true);
  });

  it("should_accept_all_valid_http_methods", () => {
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      expect(RawApiCallSchema.safeParse({ method, path: "/users/me/settings" }).success).toBe(true);
    }
  });

  it("should_accept_query_params", () => {
    expect(RawApiCallSchema.safeParse({
      method: "GET",
      path: "/calendars/primary/events",
      query: { singleEvents: "true", maxResults: "10" },
    }).success).toBe(true);
  });

  it("should_reject_invalid_method", () => {
    expect(RawApiCallSchema.safeParse({ method: "HEAD", path: "/colors" }).success).toBe(false);
  });

  it("should_reject_missing_path", () => {
    expect(RawApiCallSchema.safeParse({ method: "GET" }).success).toBe(false);
  });

  it("should_reject_missing_method", () => {
    expect(RawApiCallSchema.safeParse({ path: "/colors" }).success).toBe(false);
  });
});
