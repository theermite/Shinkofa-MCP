import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GmailClient } from "../src/lib/client.js";
import { registerMessageTools } from "../src/tools/messages.js";
import { registerDraftTools } from "../src/tools/drafts.js";
import { registerLabelTools } from "../src/tools/labels.js";
import { registerThreadTools } from "../src/tools/threads.js";
import { registerMiscTools } from "../src/tools/misc.js";

function setup() {
  return {
    client: new GmailClient({ accessToken: "test-token" }),
    server: new McpServer({ name: "test", version: "1.0.0" }),
  };
}

// ── Tool registration ─────────────────────────────────────────────────────────

describe("Tool registration", () => {
  it("should register ALL tools without throwing", () => {
    const { server, client } = setup();
    expect(() => {
      registerMessageTools(server, client);
      registerDraftTools(server, client);
      registerLabelTools(server, client);
      registerThreadTools(server, client);
      registerMiscTools(server, client);
    }).not.toThrow();
  });

  it("should register exactly 10 message tools", () => {
    const { server, client } = setup();
    const registered: string[] = [];
    const originalTool = server.tool.bind(server);
    server.tool = (name: string, ...args: unknown[]) => {
      registered.push(name);
      return (originalTool as (...a: unknown[]) => unknown)(name, ...args);
    };
    registerMessageTools(server, client);
    expect(registered).toHaveLength(10);
  });

  it("should register exactly 6 draft tools", () => {
    const { server, client } = setup();
    const registered: string[] = [];
    const originalTool = server.tool.bind(server);
    server.tool = (name: string, ...args: unknown[]) => {
      registered.push(name);
      return (originalTool as (...a: unknown[]) => unknown)(name, ...args);
    };
    registerDraftTools(server, client);
    expect(registered).toHaveLength(6);
  });

  it("should register exactly 5 label tools", () => {
    const { server, client } = setup();
    const registered: string[] = [];
    const originalTool = server.tool.bind(server);
    server.tool = (name: string, ...args: unknown[]) => {
      registered.push(name);
      return (originalTool as (...a: unknown[]) => unknown)(name, ...args);
    };
    registerLabelTools(server, client);
    expect(registered).toHaveLength(5);
  });

  it("should register exactly 6 thread tools", () => {
    const { server, client } = setup();
    const registered: string[] = [];
    const originalTool = server.tool.bind(server);
    server.tool = (name: string, ...args: unknown[]) => {
      registered.push(name);
      return (originalTool as (...a: unknown[]) => unknown)(name, ...args);
    };
    registerThreadTools(server, client);
    expect(registered).toHaveLength(6);
  });

  it("should register exactly 7 misc tools", () => {
    const { server, client } = setup();
    const registered: string[] = [];
    const originalTool = server.tool.bind(server);
    server.tool = (name: string, ...args: unknown[]) => {
      registered.push(name);
      return (originalTool as (...a: unknown[]) => unknown)(name, ...args);
    };
    registerMiscTools(server, client);
    expect(registered).toHaveLength(7);
  });

  it("should register 34 tools in total across all modules", () => {
    const { server, client } = setup();
    const registered: string[] = [];
    const originalTool = server.tool.bind(server);
    server.tool = (name: string, ...args: unknown[]) => {
      registered.push(name);
      return (originalTool as (...a: unknown[]) => unknown)(name, ...args);
    };
    registerMessageTools(server, client);
    registerDraftTools(server, client);
    registerLabelTools(server, client);
    registerThreadTools(server, client);
    registerMiscTools(server, client);
    expect(registered).toHaveLength(34);
  });
});
