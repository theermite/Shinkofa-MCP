import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import os from "node:os";
import { registerProcessTools } from "../src/tools/processes.js";

vi.mock("../src/lib/executor.js", () => ({
  runCommand: vi.fn(),
}));

import { runCommand } from "../src/lib/executor.js";

let server: McpServer;
let registered: Map<string, (...args: unknown[]) => unknown>;

const PS_OUTPUT =
  "  PID %CPU %MEM COMMAND         USER\n" +
  "    1  0.1  0.5 init            root\n" +
  " 1234 25.3  3.2 node            jay\n" +
  " 2345  5.0  2.0 bash            jay\n";

const TASKLIST_OUTPUT =
  '"node.exe","1234","Console","1","128,456 K"\n' +
  '"bash.exe","2345","Console","1","32,100 K"\n';

beforeEach(() => {
  vi.clearAllMocks();
  server = new McpServer({ name: "test", version: "1.0.0" });
  registered = new Map();
  const orig = server.tool.bind(server);
  server.tool = ((...a: unknown[]) => {
    registered.set(
      a[0] as string,
      a[a.length - 1] as (...x: unknown[]) => unknown,
    );
    return orig(...(a as Parameters<typeof orig>));
  }) as typeof server.tool;
  registerProcessTools(server);
});

describe("Process tools — registration", () => {
  it("should_register_2_process_tools", () => {
    expect(registered.has("list_processes")).toBe(true);
    expect(registered.has("get_process")).toBe(true);
  });
});

describe("list_processes", () => {
  it("should_parse_ps_output_on_unix", async () => {
    if (os.platform() === "win32") {
      vi.mocked(runCommand).mockResolvedValue({
        stdout: TASKLIST_OUTPUT,
        stderr: "",
        exitCode: 0,
        timedOut: false,
      });
    } else {
      vi.mocked(runCommand).mockResolvedValue({
        stdout: PS_OUTPUT,
        stderr: "",
        exitCode: 0,
        timedOut: false,
      });
    }
    const cb = registered.get("list_processes")!;
    const result = (await cb({ limit: 20, sortBy: "cpu" })) as {
      content: { text: string }[];
    };
    const data = JSON.parse(result.content[0].text) as Array<{
      pid: number;
    }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("should_respect_limit", async () => {
    vi.mocked(runCommand).mockResolvedValue({
      stdout: os.platform() === "win32" ? TASKLIST_OUTPUT : PS_OUTPUT,
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });
    const cb = registered.get("list_processes")!;
    const result = (await cb({ limit: 1, sortBy: "cpu" })) as {
      content: { text: string }[];
    };
    const data = JSON.parse(result.content[0].text) as unknown[];
    expect(data.length).toBeLessThanOrEqual(1);
  });

  it("should_sort_by_pid", async () => {
    vi.mocked(runCommand).mockResolvedValue({
      stdout: os.platform() === "win32" ? TASKLIST_OUTPUT : PS_OUTPUT,
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });
    const cb = registered.get("list_processes")!;
    const result = (await cb({ limit: 100, sortBy: "pid" })) as {
      content: { text: string }[];
    };
    const data = JSON.parse(result.content[0].text) as Array<{ pid: number }>;
    for (let i = 1; i < data.length; i++) {
      expect(data[i]!.pid).toBeGreaterThanOrEqual(data[i - 1]!.pid);
    }
  });
});

describe("get_process", () => {
  it("should_return_process_when_found", async () => {
    vi.mocked(runCommand).mockResolvedValue({
      stdout: os.platform() === "win32" ? TASKLIST_OUTPUT : PS_OUTPUT,
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });
    const cb = registered.get("get_process")!;
    const result = (await cb({ pid: 1234 })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.pid).toBe(1234);
  });

  it("should_error_when_pid_not_found", async () => {
    vi.mocked(runCommand).mockResolvedValue({
      stdout: os.platform() === "win32" ? TASKLIST_OUTPUT : PS_OUTPUT,
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });
    const cb = registered.get("get_process")!;
    const result = (await cb({ pid: 99999 })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("99999");
  });
});
