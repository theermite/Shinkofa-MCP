import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerResourceTools } from "../src/tools/resources.js";

vi.mock("../src/lib/executor.js", () => ({
  runCommand: vi.fn(),
}));

import { runCommand } from "../src/lib/executor.js";

let server: McpServer;
let registered: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  server = new McpServer({ name: "test", version: "1.0.0" });
  registered = new Map();
  const orig = server.tool.bind(server);
  server.tool = ((...a: unknown[]) => {
    registered.set(a[0] as string, a[a.length - 1] as (...x: unknown[]) => unknown);
    return orig(...(a as Parameters<typeof orig>));
  }) as typeof server.tool;
  registerResourceTools(server);
});

describe("Resource tools — registration", () => {
  it("should_register_4_resource_tools", () => {
    for (const n of ["get_cpu_info", "get_memory_info", "get_disk_info", "get_network_interfaces"]) {
      expect(registered.has(n)).toBe(true);
    }
  });
});

describe("get_cpu_info", () => {
  it("should_return_cores_and_model", async () => {
    const cb = registered.get("get_cpu_info")!;
    const result = (await cb({})) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty("cores");
    expect(data).toHaveProperty("model");
    expect(data).toHaveProperty("loadAverage");
  });
});

describe("get_memory_info", () => {
  it("should_return_total_free_used_and_percent", async () => {
    const cb = registered.get("get_memory_info")!;
    const result = (await cb({})) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.totalBytes).toBeGreaterThan(0);
    expect(data.freeBytes).toBeGreaterThanOrEqual(0);
    expect(data.usedBytes).toBeGreaterThanOrEqual(0);
    expect(data.usedPercent).toBeGreaterThanOrEqual(0);
    expect(data.usedPercent).toBeLessThanOrEqual(100);
  });
});

describe("get_disk_info", () => {
  it("should_parse_df_output_on_unix", async () => {
    vi.mocked(runCommand).mockResolvedValue({
      stdout:
        "Filesystem     1024-blocks       Used  Available Capacity  Mounted on\n/dev/sda1        100000000   50000000   50000000    50%      /\n",
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });
    const cb = registered.get("get_disk_info")!;
    const result = (await cb({})) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("get_network_interfaces", () => {
  it("should_return_an_object", async () => {
    const cb = registered.get("get_network_interfaces")!;
    const result = (await cb({})) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(typeof data).toBe("object");
  });
});
