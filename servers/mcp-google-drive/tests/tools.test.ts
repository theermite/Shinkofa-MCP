import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DriveClient } from "../src/lib/client.js";
import { registerFileTools } from "../src/tools/files.js";
import { registerSharingTools } from "../src/tools/sharing.js";
import { registerRawTool } from "../src/tools/raw.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeServer(): McpServer {
  return new McpServer({ name: "test-drive", version: "0.0.0" });
}

function makeClient(): DriveClient {
  // Stub fetch so the constructor does not need a real token exchange
  vi.stubGlobal("fetch", vi.fn());
  return new DriveClient({ accessToken: "test-token" });
}

// ---------------------------------------------------------------------------
// Registration smoke tests
// ---------------------------------------------------------------------------

describe("registerFileTools", () => {
  it("should_register_without_throwing", () => {
    const server = makeServer();
    const client = makeClient();
    expect(() => registerFileTools(server, client)).not.toThrow();
  });
});

describe("registerSharingTools", () => {
  it("should_register_without_throwing", () => {
    const server = makeServer();
    const client = makeClient();
    expect(() => registerSharingTools(server, client)).not.toThrow();
  });
});

describe("registerRawTool", () => {
  it("should_register_without_throwing", () => {
    const server = makeServer();
    const client = makeClient();
    expect(() => registerRawTool(server, client)).not.toThrow();
  });
});

describe("all tools combined", () => {
  it("should_register_all_tools_without_conflicts", () => {
    const server = makeServer();
    const client = makeClient();
    expect(() => {
      registerFileTools(server, client);
      registerSharingTools(server, client);
      registerRawTool(server, client);
    }).not.toThrow();
  });

  it("should_register_exactly_14_tools", () => {
    // 10 file tools + 3 sharing tools + 1 raw tool = 14
    // McpServer does not expose a public tool count, so we verify by tracking
    // server.tool calls via a spy on the prototype.
    const server = makeServer();
    const client = makeClient();
    const toolSpy = vi.spyOn(server, "tool");
    registerFileTools(server, client);
    registerSharingTools(server, client);
    registerRawTool(server, client);
    expect(toolSpy).toHaveBeenCalledTimes(14);
    toolSpy.mockRestore();
  });
});
