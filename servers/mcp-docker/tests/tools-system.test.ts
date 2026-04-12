import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DockerClient } from "../src/lib/client.js";
import { registerSystemTools } from "../src/tools/system.js";

function setup() {
  const client = new DockerClient({ host: "http://localhost:2375" });
  const server = new McpServer({ name: "test", version: "1.0.0" });
  return { client, server };
}

describe("System tools registration", () => {
  it("should register all system tools without throwing", () => {
    const { client, server } = setup();
    expect(() => registerSystemTools(server, client)).not.toThrow();
  });
});

describe("System tools count", () => {
  it("should register 6 system tools", () => {
    const { client, server } = setup();
    const toolSpy = vi.spyOn(server, "tool");
    registerSystemTools(server, client);
    expect(toolSpy.mock.calls.length).toBe(6);
  });

  it("should register expected tool names", () => {
    const { client, server } = setup();
    const toolSpy = vi.spyOn(server, "tool");
    registerSystemTools(server, client);
    const names = toolSpy.mock.calls.map((c) => c[0]);
    expect(names).toContain("docker_info");
    expect(names).toContain("docker_version");
    expect(names).toContain("docker_ping");
    expect(names).toContain("docker_df");
    expect(names).toContain("exec_inspect");
    expect(names).toContain("raw_api_call");
  });
});
