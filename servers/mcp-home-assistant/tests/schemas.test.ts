/**
 * Schema tests — inline Zod schemas from entities.ts and info.ts.
 * Because schemas live inline inside tool registration closures, we
 * recreate them here verbatim. Any drift between source and this file
 * is intentional and must be kept in sync.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Inline schema mirrors (from entities.ts)
// ---------------------------------------------------------------------------

const ListStatesSchema = z.object({
  domain: z.string().optional(),
});

const EntityId = z.string();

const GetStateSchema = z.object({ entity_id: EntityId });

const SetStateSchema = z.object({
  entity_id: EntityId,
  state: z.string(),
  attributes: z.record(z.unknown()).optional(),
});

const CallServiceSchema = z.object({
  domain: z.string(),
  service: z.string(),
  entity_id: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

const FireEventSchema = z.object({
  event_type: z.string(),
  event_data: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Inline schema mirrors (from info.ts)
// ---------------------------------------------------------------------------

const RenderTemplateSchema = z.object({
  template: z.string().max(2000),
});

const GetHistorySchema = z.object({
  timestamp: z.string().optional(),
  entity_id: z.string().optional(),
  end_time: z.string().optional(),
  minimal_response: z.boolean().optional(),
  significant_changes_only: z.boolean().optional(),
  no_attributes: z.boolean().optional(),
});

const GetCalendarEventsSchema = z.object({
  entity_id: z.string(),
  start: z.string(),
  end: z.string(),
});

const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  path: z.string(),
  body: z.record(z.unknown()).optional(),
  query: z.record(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// list_states
// ---------------------------------------------------------------------------

describe("ListStatesSchema", () => {
  it("should_accept_empty_object_when_domain_is_optional", () => {
    expect(ListStatesSchema.parse({})).toEqual({});
  });

  it("should_accept_domain_string_when_provided", () => {
    expect(ListStatesSchema.parse({ domain: "light" })).toEqual({
      domain: "light",
    });
  });

  it("should_reject_numeric_domain_when_wrong_type", () => {
    expect(() => ListStatesSchema.parse({ domain: 42 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// get_state
// ---------------------------------------------------------------------------

describe("GetStateSchema", () => {
  it("should_accept_valid_entity_id_when_string_provided", () => {
    expect(GetStateSchema.parse({ entity_id: "light.living_room" })).toEqual({
      entity_id: "light.living_room",
    });
  });

  it("should_reject_missing_entity_id_when_required", () => {
    expect(() => GetStateSchema.parse({})).toThrow();
  });

  it("should_reject_numeric_entity_id_when_wrong_type", () => {
    expect(() => GetStateSchema.parse({ entity_id: 123 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// set_state
// ---------------------------------------------------------------------------

describe("SetStateSchema", () => {
  it("should_accept_minimal_payload_when_only_required_fields_provided", () => {
    const result = SetStateSchema.parse({
      entity_id: "sensor.temp",
      state: "22.5",
    });
    expect(result.entity_id).toBe("sensor.temp");
    expect(result.state).toBe("22.5");
  });

  it("should_accept_attributes_when_provided_as_object", () => {
    const result = SetStateSchema.parse({
      entity_id: "sensor.temp",
      state: "22.5",
      attributes: { unit: "°C" },
    });
    expect(result.attributes).toEqual({ unit: "°C" });
  });

  it("should_reject_missing_state_when_required", () => {
    expect(() =>
      SetStateSchema.parse({ entity_id: "sensor.temp" }),
    ).toThrow();
  });

  it("should_reject_missing_entity_id_when_required", () => {
    expect(() => SetStateSchema.parse({ state: "on" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// call_service
// ---------------------------------------------------------------------------

describe("CallServiceSchema", () => {
  it("should_accept_minimal_payload_when_only_domain_and_service_provided", () => {
    const result = CallServiceSchema.parse({
      domain: "light",
      service: "turn_on",
    });
    expect(result.domain).toBe("light");
    expect(result.service).toBe("turn_on");
  });

  it("should_accept_optional_entity_id_when_provided", () => {
    const result = CallServiceSchema.parse({
      domain: "light",
      service: "turn_on",
      entity_id: "light.kitchen",
    });
    expect(result.entity_id).toBe("light.kitchen");
  });

  it("should_accept_data_payload_when_provided", () => {
    const result = CallServiceSchema.parse({
      domain: "climate",
      service: "set_temperature",
      data: { temperature: 21 },
    });
    expect(result.data).toEqual({ temperature: 21 });
  });

  it("should_reject_missing_domain_when_required", () => {
    expect(() => CallServiceSchema.parse({ service: "turn_on" })).toThrow();
  });

  it("should_reject_missing_service_when_required", () => {
    expect(() => CallServiceSchema.parse({ domain: "light" })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// fire_event
// ---------------------------------------------------------------------------

describe("FireEventSchema", () => {
  it("should_accept_event_type_when_provided", () => {
    expect(
      FireEventSchema.parse({ event_type: "my_custom_event" }),
    ).toEqual({ event_type: "my_custom_event" });
  });

  it("should_accept_optional_event_data_when_provided", () => {
    const result = FireEventSchema.parse({
      event_type: "alarm_triggered",
      event_data: { zone: "front_door" },
    });
    expect(result.event_data).toEqual({ zone: "front_door" });
  });

  it("should_reject_missing_event_type_when_required", () => {
    expect(() => FireEventSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// render_template
// ---------------------------------------------------------------------------

describe("RenderTemplateSchema", () => {
  it("should_accept_valid_template_string_when_under_2000_chars", () => {
    expect(
      RenderTemplateSchema.parse({ template: "{{ states('sensor.temp') }}" }),
    ).toBeDefined();
  });

  it("should_reject_template_exceeding_2000_chars_when_too_long", () => {
    expect(() =>
      RenderTemplateSchema.parse({ template: "x".repeat(2001) }),
    ).toThrow();
  });

  it("should_accept_template_at_exactly_2000_chars_when_at_limit", () => {
    expect(
      RenderTemplateSchema.parse({ template: "x".repeat(2000) }),
    ).toBeDefined();
  });

  it("should_reject_missing_template_when_required", () => {
    expect(() => RenderTemplateSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// get_history (with new params)
// ---------------------------------------------------------------------------

describe("GetHistorySchema", () => {
  it("should_accept_empty_object_when_all_params_are_optional", () => {
    expect(GetHistorySchema.parse({})).toEqual({});
  });

  it("should_accept_timestamp_when_provided_as_string", () => {
    const result = GetHistorySchema.parse({
      timestamp: "2026-04-08T00:00:00Z",
    });
    expect(result.timestamp).toBe("2026-04-08T00:00:00Z");
  });

  it("should_accept_significant_changes_only_when_true", () => {
    const result = GetHistorySchema.parse({ significant_changes_only: true });
    expect(result.significant_changes_only).toBe(true);
  });

  it("should_accept_no_attributes_when_true", () => {
    const result = GetHistorySchema.parse({ no_attributes: true });
    expect(result.no_attributes).toBe(true);
  });

  it("should_reject_non_boolean_for_minimal_response_when_wrong_type", () => {
    expect(() =>
      GetHistorySchema.parse({ minimal_response: "yes" }),
    ).toThrow();
  });

  it("should_accept_all_params_simultaneously_when_all_provided", () => {
    const result = GetHistorySchema.parse({
      timestamp: "2026-04-08T00:00:00Z",
      entity_id: "light.x",
      end_time: "2026-04-08T12:00:00Z",
      minimal_response: true,
      significant_changes_only: true,
      no_attributes: true,
    });
    expect(result.significant_changes_only).toBe(true);
    expect(result.no_attributes).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// get_calendar_events
// ---------------------------------------------------------------------------

describe("GetCalendarEventsSchema", () => {
  it("should_accept_valid_payload_when_all_required_fields_provided", () => {
    const result = GetCalendarEventsSchema.parse({
      entity_id: "calendar.home",
      start: "2026-04-01T00:00:00Z",
      end: "2026-04-30T23:59:59Z",
    });
    expect(result.entity_id).toBe("calendar.home");
  });

  it("should_reject_missing_start_when_required", () => {
    expect(() =>
      GetCalendarEventsSchema.parse({
        entity_id: "calendar.home",
        end: "2026-04-30T23:59:59Z",
      }),
    ).toThrow();
  });

  it("should_reject_missing_end_when_required", () => {
    expect(() =>
      GetCalendarEventsSchema.parse({
        entity_id: "calendar.home",
        start: "2026-04-01T00:00:00Z",
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// raw_api_call
// ---------------------------------------------------------------------------

describe("RawApiCallSchema", () => {
  it("should_accept_GET_method_when_provided", () => {
    expect(
      RawApiCallSchema.parse({ method: "GET", path: "/states" }),
    ).toMatchObject({ method: "GET" });
  });

  it("should_accept_POST_with_body_when_provided", () => {
    const result = RawApiCallSchema.parse({
      method: "POST",
      path: "/services/light/turn_on",
      body: { entity_id: "light.x" },
    });
    expect(result.body).toEqual({ entity_id: "light.x" });
  });

  it("should_accept_query_params_when_provided_as_string_record", () => {
    const result = RawApiCallSchema.parse({
      method: "GET",
      path: "/history/period",
      query: { filter_entity_id: "light.x" },
    });
    expect(result.query).toEqual({ filter_entity_id: "light.x" });
  });

  it("should_reject_invalid_method_when_not_in_enum", () => {
    expect(() =>
      RawApiCallSchema.parse({ method: "PATCH", path: "/states" }),
    ).toThrow();
  });

  it("should_reject_missing_path_when_required", () => {
    expect(() => RawApiCallSchema.parse({ method: "GET" })).toThrow();
  });

  it("should_reject_missing_method_when_required", () => {
    expect(() => RawApiCallSchema.parse({ path: "/states" })).toThrow();
  });
});
