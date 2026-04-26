import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerInfoTools } from "../src/tools/info.js";

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
  registerInfoTools(server);
});

describe("Info tools — registration", () => {
  it("should_register_4_info_tools", () => {
    for (const n of ["get_system_info", "get_uptime", "get_env_vars", "which_command"]) {
      expect(registered.has(n)).toBe(true);
    }
  });
});

describe("get_system_info", () => {
  it("should_return_platform_and_arch", async () => {
    const cb = registered.get("get_system_info")!;
    const result = (await cb({})) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty("platform");
    expect(data).toHaveProperty("arch");
    expect(data).toHaveProperty("hostname");
    expect(data).toHaveProperty("nodeVersion");
  });
});

describe("get_uptime", () => {
  it("should_include_human_format", async () => {
    const cb = registered.get("get_uptime")!;
    const result = (await cb({})) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.uptimeHuman).toMatch(/\d+d \d+h \d+m \d+s/);
  });
});

describe("get_env_vars", () => {
  it("should_mask_secret_looking_vars_by_default", async () => {
    process.env.TEST_FAKE_TOKEN = "abc1234567890def";
    const cb = registered.get("get_env_vars")!;
    const result = (await cb({ unmask: false })) as {
      content: { text: string }[];
    };
    const data = JSON.parse(result.content[0].text);
    expect(data.TEST_FAKE_TOKEN).toContain("***");
    delete process.env.TEST_FAKE_TOKEN;
  });

  it("should_unmask_when_requested", async () => {
    process.env.TEST_FAKE_TOKEN = "abc1234567890def";
    const cb = registered.get("get_env_vars")!;
    const result = (await cb({ unmask: true })) as {
      content: { text: string }[];
    };
    const data = JSON.parse(result.content[0].text);
    expect(data.TEST_FAKE_TOKEN).toBe("abc1234567890def");
    delete process.env.TEST_FAKE_TOKEN;
  });

  it("should_filter_by_substring", async () => {
    process.env.ZZ_MYCUSTOM_VAR = "val";
    const cb = registered.get("get_env_vars")!;
    const result = (await cb({ filter: "ZZ_MYCUSTOM", unmask: true })) as {
      content: { text: string }[];
    };
    const data = JSON.parse(result.content[0].text);
    expect(Object.keys(data)).toContain("ZZ_MYCUSTOM_VAR");
    delete process.env.ZZ_MYCUSTOM_VAR;
  });
});

describe("which_command", () => {
  it("should_return_found_true_when_path_present", async () => {
    vi.mocked(runCommand).mockResolvedValue({
      stdout: "/usr/bin/node\n",
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });
    const cb = registered.get("which_command")!;
    const result = (await cb({ command: "node" })) as {
      content: { text: string }[];
    };
    const data = JSON.parse(result.content[0].text);
    expect(data.found).toBe(true);
    expect(data.path).toBe("/usr/bin/node");
  });

  it("should_return_found_false_when_missing", async () => {
    vi.mocked(runCommand).mockResolvedValue({
      stdout: "",
      stderr: "not found",
      exitCode: 1,
      timedOut: false,
    });
    const cb = registered.get("which_command")!;
    const result = (await cb({ command: "doesnotexist" })) as {
      content: { text: string }[];
    };
    const data = JSON.parse(result.content[0].text);
    expect(data.found).toBe(false);
  });
});
