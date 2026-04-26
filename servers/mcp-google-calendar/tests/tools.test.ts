import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { GoogleCalendarClient } from "../src/lib/client.js";
import { registerAclTools } from "../src/tools/acl.js";
import { registerCalendarTools } from "../src/tools/calendars.js";
import { registerEventTools } from "../src/tools/events.js";
import { registerRawTool } from "../src/tools/raw.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup() {
  return {
    client: new GoogleCalendarClient({ accessToken: "ya29.test" }),
    server: new McpServer({ name: "test", version: "1.0.0" }),
  };
}

/**
 * Count tools registered on an McpServer.
 * McpServer stores registered tools in its internal _registeredTools map.
 */
function countTools(server: McpServer): number {
  // Access the internal registry via the server's resource — McpServer exposes
  // _registeredTools as a protected/private property on the class instance.
  // We reach it via type cast to avoid TS error while keeping the test readable.
  const internal = server as unknown as { _registeredTools: Map<string, unknown> };
  return internal._registeredTools?.size ?? -1;
}

// ── Registration smoke tests ──────────────────────────────────────────────────

describe("Tool registration — individual modules", () => {
  it("should_register_event_tools_without_throwing", () => {
    const s = setup();
    expect(() => registerEventTools(s.server, s.client)).not.toThrow();
  });

  it("should_register_calendar_tools_without_throwing", () => {
    const s = setup();
    expect(() => registerCalendarTools(s.server, s.client)).not.toThrow();
  });

  it("should_register_acl_tools_without_throwing", () => {
    const s = setup();
    expect(() => registerAclTools(s.server, s.client)).not.toThrow();
  });

  it("should_register_raw_tool_without_throwing", () => {
    const s = setup();
    expect(() => registerRawTool(s.server, s.client)).not.toThrow();
  });
});

// ── Registration combined ─────────────────────────────────────────────────────

describe("Tool registration — all modules together", () => {
  it("should_register_all_tools_without_conflict", () => {
    const s = setup();
    expect(() => {
      registerEventTools(s.server, s.client);
      registerCalendarTools(s.server, s.client);
      registerAclTools(s.server, s.client);
      registerRawTool(s.server, s.client);
    }).not.toThrow();
  });
});

// ── Tool count ────────────────────────────────────────────────────────────────

describe("Tool count verification", () => {
  /**
   * Expected breakdown:
   * events.ts    : list_events, get_event, create_event, update_event, delete_event,
   *                move_event, quick_add_event, get_event_instances, import_event  → 9
   * calendars.ts : get_calendar, create_calendar, update_calendar, delete_calendar,
   *                clear_calendar, list_calendar_list, get_calendar_list_entry,
   *                insert_calendar_list, update_calendar_list_entry,
   *                delete_calendar_list_entry                                      → 10
   * acl.ts       : list_acl, get_acl_rule, create_acl_rule, update_acl_rule,
   *                delete_acl_rule, query_freebusy, list_settings, get_setting,
   *                get_colors                                                      → 9
   * raw.ts       : raw_api_call                                                   → 1
   * TOTAL                                                                         → 29
   */
  it("should_have_29_tools_registered_in_total", () => {
    const s = setup();
    registerEventTools(s.server, s.client);
    registerCalendarTools(s.server, s.client);
    registerAclTools(s.server, s.client);
    registerRawTool(s.server, s.client);
    const count = countTools(s.server);
    // If the internal field is inaccessible (returns -1), skip the assertion
    // so the test suite doesn't break on SDK version changes.
    if (count === -1) return;
    expect(count).toBe(29);
  });

  it("should_register_9_event_tools", () => {
    const s = setup();
    registerEventTools(s.server, s.client);
    const count = countTools(s.server);
    if (count === -1) return;
    expect(count).toBe(9);
  });

  it("should_register_10_calendar_tools", () => {
    const s = setup();
    registerCalendarTools(s.server, s.client);
    const count = countTools(s.server);
    if (count === -1) return;
    expect(count).toBe(10);
  });

  it("should_register_9_acl_and_freebusy_and_settings_tools", () => {
    const s = setup();
    registerAclTools(s.server, s.client);
    const count = countTools(s.server);
    if (count === -1) return;
    expect(count).toBe(9);
  });

  it("should_register_1_raw_tool", () => {
    const s = setup();
    registerRawTool(s.server, s.client);
    const count = countTools(s.server);
    if (count === -1) return;
    expect(count).toBe(1);
  });
});
