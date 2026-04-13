import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerExecTools } from "../src/tools/exec.js";

vi.mock("../src/lib/executor.js", () => ({
  runCommand: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
  },
}));

import { runCommand } from "../src/lib/executor.js";
import fs from "node:fs/promises";

let server: McpServer;
let registered: Map<string, (...args: unknown[]) => unknown>;

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
  registerExecTools(server);
});

describe("Exec tools — registration", () => {
  it("should_register_4_exec_tools", () => {
    for (const n of ["kill_process", "exec_command", "read_file", "write_file"]) {
      expect(registered.has(n)).toBe(true);
    }
  });
});

describe("exec_command", () => {
  it("should_forward_command_and_args", async () => {
    vi.mocked(runCommand).mockResolvedValue({
      stdout: "hello\n",
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });
    const cb = registered.get("exec_command")!;
    const result = (await cb({
      command: "echo",
      args: ["hello"],
      timeoutMs: 5000,
    })) as { content: { text: string }[] };
    expect(runCommand).toHaveBeenCalledWith(
      "echo",
      ["hello"],
      expect.objectContaining({ timeoutMs: 5000 }),
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.stdout).toBe("hello\n");
    expect(data.exitCode).toBe(0);
  });

  it("should_report_timeout", async () => {
    vi.mocked(runCommand).mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 1,
      timedOut: true,
    });
    const cb = registered.get("exec_command")!;
    const result = (await cb({
      command: "sleep",
      args: ["100"],
      timeoutMs: 1000,
    })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.timedOut).toBe(true);
  });
});

describe("read_file", () => {
  it("should_read_utf8_file", async () => {
    vi.mocked(fs.stat).mockResolvedValue({
      isFile: () => true,
      size: 5,
    } as unknown as Awaited<ReturnType<typeof fs.stat>>);
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from("hello"));

    const cb = registered.get("read_file")!;
    const result = (await cb({
      path: "/tmp/test.txt",
      encoding: "utf8",
      maxBytes: 1_048_576,
    })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.content).toBe("hello");
    expect(data.size).toBe(5);
  });

  it("should_reject_directory", async () => {
    vi.mocked(fs.stat).mockResolvedValue({
      isFile: () => false,
      size: 0,
    } as unknown as Awaited<ReturnType<typeof fs.stat>>);
    const cb = registered.get("read_file")!;
    const result = (await cb({
      path: "/tmp",
      encoding: "utf8",
      maxBytes: 1_048_576,
    })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
  });

  it("should_reject_oversize_file", async () => {
    vi.mocked(fs.stat).mockResolvedValue({
      isFile: () => true,
      size: 2_000_000,
    } as unknown as Awaited<ReturnType<typeof fs.stat>>);
    const cb = registered.get("read_file")!;
    const result = (await cb({
      path: "/tmp/big",
      encoding: "utf8",
      maxBytes: 1_048_576,
    })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("ETOOBIG");
  });

  it("should_base64_encode", async () => {
    vi.mocked(fs.stat).mockResolvedValue({
      isFile: () => true,
      size: 5,
    } as unknown as Awaited<ReturnType<typeof fs.stat>>);
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from("hello"));
    const cb = registered.get("read_file")!;
    const result = (await cb({
      path: "/tmp/x",
      encoding: "base64",
      maxBytes: 1_048_576,
    })) as { content: { text: string }[] };
    const data = JSON.parse(result.content[0].text);
    expect(data.content).toBe(Buffer.from("hello").toString("base64"));
  });
});

describe("write_file", () => {
  it("should_write_utf8", async () => {
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    const cb = registered.get("write_file")!;
    const result = (await cb({
      path: "/tmp/x",
      content: "hello",
      encoding: "utf8",
      append: false,
    })) as { content: { text: string }[] };
    expect(fs.writeFile).toHaveBeenCalled();
    const data = JSON.parse(result.content[0].text);
    expect(data.bytesWritten).toBe(5);
    expect(data.mode).toBe("overwrite");
  });

  it("should_append_when_flag_set", async () => {
    vi.mocked(fs.appendFile).mockResolvedValue(undefined);
    const cb = registered.get("write_file")!;
    const result = (await cb({
      path: "/tmp/x",
      content: "more",
      encoding: "utf8",
      append: true,
    })) as { content: { text: string }[] };
    expect(fs.appendFile).toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
    const data = JSON.parse(result.content[0].text);
    expect(data.mode).toBe("append");
  });

  it("should_decode_base64", async () => {
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    const cb = registered.get("write_file")!;
    await cb({
      path: "/tmp/x",
      content: Buffer.from("hello").toString("base64"),
      encoding: "base64",
      append: false,
    });
    const call = vi.mocked(fs.writeFile).mock.calls[0]!;
    expect((call[1] as Buffer).toString("utf8")).toBe("hello");
  });
});

describe("kill_process", () => {
  it("should_send_signal_to_pid", async () => {
    const killSpy = vi.spyOn(process, "kill").mockReturnValue(true);
    const cb = registered.get("kill_process")!;
    const result = (await cb({ pid: 99999, signal: "SIGTERM" })) as {
      content: { text: string }[];
    };
    expect(killSpy).toHaveBeenCalledWith(99999, "SIGTERM");
    const data = JSON.parse(result.content[0].text);
    expect(data.sent).toBe(true);
    killSpy.mockRestore();
  });

  it("should_error_on_unknown_pid", async () => {
    const killSpy = vi.spyOn(process, "kill").mockImplementation(() => {
      const e = new Error("ESRCH") as NodeJS.ErrnoException;
      e.code = "ESRCH";
      throw e;
    });
    const cb = registered.get("kill_process")!;
    const result = (await cb({ pid: 99999, signal: "SIGTERM" })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("ESRCH");
    killSpy.mockRestore();
  });
});
