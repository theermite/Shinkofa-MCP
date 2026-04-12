import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DockerClient } from "../src/lib/client.js";
import { registerImageTools } from "../src/tools/images.js";

function setup() {
  const client = new DockerClient({ host: "http://localhost:2375" });
  const server = new McpServer({ name: "test", version: "1.0.0" });
  return { client, server };
}

describe("Image tools registration", () => {
  it("should register all image tools without throwing", () => {
    const { client, server } = setup();
    expect(() => registerImageTools(server, client)).not.toThrow();
  });
});

describe("Image tools count", () => {
  it("should register 8 image tools", () => {
    const { client, server } = setup();
    const toolSpy = vi.spyOn(server, "tool");
    registerImageTools(server, client);
    expect(toolSpy.mock.calls.length).toBe(8);
  });

  it("should register expected tool names", () => {
    const { client, server } = setup();
    const toolSpy = vi.spyOn(server, "tool");
    registerImageTools(server, client);
    const names = toolSpy.mock.calls.map((c) => c[0]);
    expect(names).toContain("list_images");
    expect(names).toContain("inspect_image");
    expect(names).toContain("pull_image");
    expect(names).toContain("remove_image");
    expect(names).toContain("tag_image");
    expect(names).toContain("search_images");
    expect(names).toContain("image_history");
    expect(names).toContain("prune_images");
  });
});
