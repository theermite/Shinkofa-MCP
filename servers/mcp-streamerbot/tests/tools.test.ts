import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createConfig, StreamerbotClient } from "../src/lib/client.js";
import { registerInfoTools } from "../src/tools/info.js";
import { registerActionTools } from "../src/tools/actions.js";
import { registerEventTools } from "../src/tools/events.js";
import { registerCreditTools } from "../src/tools/credits.js";
import { registerGlobalTools } from "../src/tools/globals.js";
import { registerTriggerTools } from "../src/tools/triggers.js";

const config = createConfig({});
const client = new StreamerbotClient(config);

function setup() {
  return new McpServer({ name: "test-streamerbot", version: "1.0.0" });
}

function trackTools(server: McpServer) {
  const registered: string[] = [];
  const origTool = server.tool.bind(server);
  server.tool = ((name: string, ...args: unknown[]) => {
    registered.push(name);
    return origTool(name, ...args);
  }) as typeof server.tool;
  return registered;
}

describe("Info tool registration", () => {
  it("should_register_5_info_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerInfoTools(server, client);
    expect(registered).toEqual([
      "sb-get-info",
      "sb-get-actions",
      "sb-get-commands",
      "sb-get-broadcaster",
      "sb-get-active-viewers",
    ]);
    expect(registered).toHaveLength(5);
  });
});

describe("Action tool registration", () => {
  it("should_register_2_action_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerActionTools(server, client);
    expect(registered).toEqual(["sb-do-action", "sb-send-message"]);
    expect(registered).toHaveLength(2);
  });
});

describe("Event tool registration", () => {
  it("should_register_2_event_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerEventTools(server, client);
    expect(registered).toEqual(["sb-get-events", "sb-subscribe"]);
    expect(registered).toHaveLength(2);
  });
});

describe("Credit tool registration", () => {
  it("should_register_2_credit_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerCreditTools(server, client);
    expect(registered).toEqual(["sb-get-credits", "sb-clear-credits"]);
    expect(registered).toHaveLength(2);
  });
});

describe("Global tool registration", () => {
  it("should_register_2_global_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerGlobalTools(server, client);
    expect(registered).toEqual(["sb-get-globals", "sb-get-global"]);
    expect(registered).toHaveLength(2);
  });
});

describe("Trigger tool registration", () => {
  it("should_register_2_trigger_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerTriggerTools(server, client);
    expect(registered).toEqual(["sb-get-code-triggers", "sb-execute-code-trigger"]);
    expect(registered).toHaveLength(2);
  });
});

describe("Combined registration", () => {
  it("should_register_15_total_tools", () => {
    const server = setup();
    const registered = trackTools(server);
    registerInfoTools(server, client);
    registerActionTools(server, client);
    registerEventTools(server, client);
    registerCreditTools(server, client);
    registerGlobalTools(server, client);
    registerTriggerTools(server, client);
    expect(registered).toHaveLength(15);
  });
});
