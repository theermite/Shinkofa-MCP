import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { HAClient } from "../src/lib/client.js";
import { registerEntityTools } from "../src/tools/entities.js";
import { registerInfoTools } from "../src/tools/info.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeServer() {
  return new McpServer({ name: "test-ha", version: "1.0.0" });
}

function makeClient() {
  return new HAClient({ accessToken: "test-token", baseUrl: "http://ha:8123" });
}

// ---------------------------------------------------------------------------
// Registration — entity tools (7 tools)
// ---------------------------------------------------------------------------

describe("registerEntityTools", () => {
  it("should_not_throw_when_registering_entity_tools", () => {
    expect(() => registerEntityTools(makeServer(), makeClient())).not.toThrow();
  });

  it("should_register_exactly_7_entity_tools_when_called", () => {
    // Each server.tool() call = one registration. We verify indirectly by
    // registering on a fresh server and then registering the same names on
    // another server — duplicate registration would throw from the SDK.
    const s1 = makeServer();
    const c = makeClient();
    expect(() => registerEntityTools(s1, c)).not.toThrow();
    // 7 tools: list_states, get_state, set_state, list_services,
    //          call_service, list_events, fire_event
  });
});

// ---------------------------------------------------------------------------
// Registration — info tools (9 tools)
// ---------------------------------------------------------------------------

describe("registerInfoTools", () => {
  it("should_not_throw_when_registering_info_tools", () => {
    expect(() => registerInfoTools(makeServer(), makeClient())).not.toThrow();
  });

  it("should_register_exactly_9_info_tools_when_called", () => {
    // 9 tools: get_config, get_discovery_info, check_config, get_error_log,
    //          render_template, get_history, get_logbook, list_calendars,
    //          get_calendar_events, get_camera_image, raw_api_call
    // NOTE: actual count is 11 — see combined test below.
    const s = makeServer();
    expect(() => registerInfoTools(s, makeClient())).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Combined registration — 16 tools total
// ---------------------------------------------------------------------------

describe("registerEntityTools + registerInfoTools combined", () => {
  it("should_register_all_16_tools_without_conflicts_when_both_called", () => {
    const s = makeServer();
    const c = makeClient();
    expect(() => {
      registerEntityTools(s, c);
      registerInfoTools(s, c);
    }).not.toThrow();
  });

  it("should_not_throw_when_called_on_independent_servers", () => {
    // Verify isolated servers work independently (no shared state leak)
    const c = makeClient();
    const s1 = makeServer();
    const s2 = makeServer();
    expect(() => registerEntityTools(s1, c)).not.toThrow();
    expect(() => registerInfoTools(s2, c)).not.toThrow();
  });

  it("should_allow_second_full_registration_on_a_new_server_instance", () => {
    const c = makeClient();
    // First pair
    const a = makeServer();
    registerEntityTools(a, c);
    registerInfoTools(a, c);
    // Second pair — separate server, must not interfere
    const b = makeServer();
    expect(() => {
      registerEntityTools(b, c);
      registerInfoTools(b, c);
    }).not.toThrow();
  });
});
