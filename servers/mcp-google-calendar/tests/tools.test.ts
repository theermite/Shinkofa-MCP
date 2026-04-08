import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GoogleCalendarClient } from "../src/lib/client.js";
import { registerEventTools } from "../src/tools/events.js";
import { registerCalendarTools } from "../src/tools/calendars.js";
import { registerAclTools } from "../src/tools/acl.js";
import { registerRawTool } from "../src/tools/raw.js";

function setup() { return { client: new GoogleCalendarClient({ accessToken: "ya29.test" }), server: new McpServer({ name: "test", version: "1.0.0" }) }; }

describe("Tool registration", () => {
  it("events", () => { const s = setup(); expect(() => registerEventTools(s.server, s.client)).not.toThrow(); });
  it("calendars", () => { const s = setup(); expect(() => registerCalendarTools(s.server, s.client)).not.toThrow(); });
  it("acl", () => { const s = setup(); expect(() => registerAclTools(s.server, s.client)).not.toThrow(); });
  it("raw", () => { const s = setup(); expect(() => registerRawTool(s.server, s.client)).not.toThrow(); });
  it("ALL tools without conflict", () => {
    const s = setup();
    expect(() => { registerEventTools(s.server, s.client); registerCalendarTools(s.server, s.client); registerAclTools(s.server, s.client); registerRawTool(s.server, s.client); }).not.toThrow();
  });
});
