import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import { DockerClient } from "../src/lib/client.js";
import { registerResourceTools } from "../src/tools/resources.js";

function setup() {
  const client = new DockerClient({ host: "http://localhost:2375" });
  const server = new McpServer({ name: "test", version: "1.0.0" });
  return { client, server };
}

describe("Resource tools registration", () => {
  it("should register all resource tools without throwing", () => {
    const { client, server } = setup();
    expect(() => registerResourceTools(server, client)).not.toThrow();
  });
});

describe("Resource tools count", () => {
  it("should register 12 resource tools (5 volume + 7 network)", () => {
    const { client, server } = setup();
    const toolSpy = vi.spyOn(server, "tool");
    registerResourceTools(server, client);
    expect(toolSpy.mock.calls.length).toBe(12);
  });

  it("should register volume tool names", () => {
    const { client, server } = setup();
    const toolSpy = vi.spyOn(server, "tool");
    registerResourceTools(server, client);
    const names = toolSpy.mock.calls.map((c) => c[0]);
    expect(names).toContain("list_volumes");
    expect(names).toContain("create_volume");
    expect(names).toContain("inspect_volume");
    expect(names).toContain("remove_volume");
    expect(names).toContain("prune_volumes");
  });

  it("should register network tool names", () => {
    const { client, server } = setup();
    const toolSpy = vi.spyOn(server, "tool");
    registerResourceTools(server, client);
    const names = toolSpy.mock.calls.map((c) => c[0]);
    expect(names).toContain("list_networks");
    expect(names).toContain("create_network");
    expect(names).toContain("inspect_network");
    expect(names).toContain("remove_network");
    expect(names).toContain("connect_network");
    expect(names).toContain("disconnect_network");
    expect(names).toContain("prune_networks");
  });
});
