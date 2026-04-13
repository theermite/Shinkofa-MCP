import { describe, it, expect } from "vitest";
import {
  GetEnvVarsSchema,
  ListProcessesSchema,
  GetProcessSchema,
  WhichCommandSchema,
  KillProcessSchema,
  ExecCommandSchema,
  ReadFileSchema,
  WriteFileSchema,
} from "../src/lib/schemas.js";

describe("GetEnvVarsSchema", () => {
  it("should_default_unmask_to_false", () => {
    expect(GetEnvVarsSchema.parse({}).unmask).toBe(false);
  });
  it("should_accept_filter", () => {
    expect(GetEnvVarsSchema.parse({ filter: "PATH" }).filter).toBe("PATH");
  });
});

describe("ListProcessesSchema", () => {
  it("should_default_limit_and_sort", () => {
    const r = ListProcessesSchema.parse({});
    expect(r.limit).toBe(20);
    expect(r.sortBy).toBe("cpu");
  });
  it("should_reject_limit_over_500", () => {
    expect(ListProcessesSchema.safeParse({ limit: 501 }).success).toBe(false);
  });
  it("should_accept_memory_sort", () => {
    expect(ListProcessesSchema.parse({ sortBy: "memory" }).sortBy).toBe(
      "memory",
    );
  });
});

describe("GetProcessSchema", () => {
  it("should_require_positive_pid", () => {
    expect(GetProcessSchema.safeParse({ pid: 0 }).success).toBe(false);
    expect(GetProcessSchema.safeParse({ pid: -1 }).success).toBe(false);
    expect(GetProcessSchema.safeParse({ pid: 1234 }).success).toBe(true);
  });
});

describe("WhichCommandSchema", () => {
  it("should_require_non_empty", () => {
    expect(WhichCommandSchema.safeParse({ command: "" }).success).toBe(false);
  });
});

describe("KillProcessSchema", () => {
  it("should_default_signal_to_sigterm", () => {
    expect(KillProcessSchema.parse({ pid: 1234 }).signal).toBe("SIGTERM");
  });
  it("should_accept_numeric_signal", () => {
    expect(KillProcessSchema.parse({ pid: 1234, signal: 9 }).signal).toBe(9);
  });
});

describe("ExecCommandSchema", () => {
  it("should_default_args_to_empty", () => {
    expect(ExecCommandSchema.parse({ command: "ls" }).args).toEqual([]);
  });
  it("should_default_timeout_to_30s", () => {
    expect(ExecCommandSchema.parse({ command: "ls" }).timeoutMs).toBe(30_000);
  });
  it("should_reject_timeout_over_10min", () => {
    expect(
      ExecCommandSchema.safeParse({ command: "ls", timeoutMs: 600_001 })
        .success,
    ).toBe(false);
  });
});

describe("ReadFileSchema", () => {
  it("should_default_encoding_utf8", () => {
    expect(ReadFileSchema.parse({ path: "/tmp/x" }).encoding).toBe("utf8");
  });
  it("should_default_maxBytes_1mb", () => {
    expect(ReadFileSchema.parse({ path: "/tmp/x" }).maxBytes).toBe(1_048_576);
  });
  it("should_reject_over_10mb", () => {
    expect(
      ReadFileSchema.safeParse({ path: "/x", maxBytes: 10_485_761 }).success,
    ).toBe(false);
  });
});

describe("WriteFileSchema", () => {
  it("should_default_append_false", () => {
    expect(
      WriteFileSchema.parse({ path: "/tmp/x", content: "hi" }).append,
    ).toBe(false);
  });
  it("should_accept_base64", () => {
    expect(
      WriteFileSchema.parse({
        path: "/tmp/x",
        content: "aGVsbG8=",
        encoding: "base64",
      }).encoding,
    ).toBe("base64");
  });
});
