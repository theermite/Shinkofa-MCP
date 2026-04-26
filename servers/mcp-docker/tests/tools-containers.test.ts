import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import { DockerClient } from "../src/lib/client.js";
import { registerContainerTools } from "../src/tools/containers.js";

function setup() {
  const client = new DockerClient({ host: "http://localhost:2375" });
  const server = new McpServer({ name: "test", version: "1.0.0" });
  return { client, server };
}

describe("Container tools registration", () => {
  it("should register all container tools without throwing", () => {
    const { client, server } = setup();
    expect(() => registerContainerTools(server, client)).not.toThrow();
  });
});

describe("Container tools count", () => {
  it("should register 17 container tools", () => {
    const { client, server } = setup();
    const toolSpy = vi.spyOn(server, "tool");
    registerContainerTools(server, client);
    expect(toolSpy.mock.calls.length).toBe(18);
  });

  it("should register expected tool names", () => {
    const { client, server } = setup();
    const toolSpy = vi.spyOn(server, "tool");
    registerContainerTools(server, client);
    const names = toolSpy.mock.calls.map((c) => c[0]);
    expect(names).toContain("list_containers");
    expect(names).toContain("create_container");
    expect(names).toContain("inspect_container");
    expect(names).toContain("start_container");
    expect(names).toContain("stop_container");
    expect(names).toContain("restart_container");
    expect(names).toContain("kill_container");
    expect(names).toContain("remove_container");
    expect(names).toContain("container_logs");
    expect(names).toContain("container_stats");
    expect(names).toContain("container_top");
    expect(names).toContain("rename_container");
    expect(names).toContain("pause_container");
    expect(names).toContain("unpause_container");
    expect(names).toContain("wait_container");
    expect(names).toContain("update_container");
    expect(names).toContain("exec_create");
    expect(names).toContain("prune_containers");
  });
});
