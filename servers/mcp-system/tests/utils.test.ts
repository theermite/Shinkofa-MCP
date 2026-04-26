import { describe, expect, it } from "vitest";
import {
  isExecAllowed,
  maskSecretValue,
  SystemError,
  toolError,
  toolResult,
  withErrorHandler,
} from "../src/lib/utils.js";

describe("toolResult", () => {
  it("should_format_data_as_json", () => {
    const r = toolResult({ pid: 42 });
    expect(JSON.parse(r.content[0].text)).toEqual({ pid: 42 });
  });
  it("should_return_success_for_undefined", () => {
    expect(toolResult(undefined).content[0].text).toBe('{"status":"success"}');
  });
});

describe("toolError", () => {
  it("should_flag_as_error", () => {
    expect(toolError("fail").isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should_pass_through_success", async () => {
    expect(await withErrorHandler(async () => "ok")).toBe("ok");
  });
  it("should_catch_SystemError", async () => {
    const r = await withErrorHandler(async () => {
      throw new SystemError("ENOENT", "not found");
    });
    expect(r).toHaveProperty("isError", true);
    expect((r as { content: { text: string }[] }).content[0].text).toContain("ENOENT");
  });
  it("should_catch_generic_error", async () => {
    const r = await withErrorHandler(async () => {
      throw new Error("boom");
    });
    expect(r).toHaveProperty("isError", true);
  });
  it("should_rethrow_non_error_throws", async () => {
    await expect(
      withErrorHandler(async () => {
        throw "bare string";
      }),
    ).rejects.toBe("bare string");
  });
});

describe("maskSecretValue", () => {
  it("should_mask_token_var", () => {
    expect(maskSecretValue("GITHUB_TOKEN", "ghp_1234567890abcdef")).toContain("***");
  });
  it("should_mask_secret_var", () => {
    expect(maskSecretValue("CLIENT_SECRET", "abcdefghij")).toBe("ab***ij");
  });
  it("should_mask_key_var", () => {
    expect(maskSecretValue("API_KEY", "longvalue123")).toContain("***");
  });
  it("should_mask_password_var", () => {
    expect(maskSecretValue("DB_PASSWORD", "hunter2hunter")).toContain("***");
  });
  it("should_not_mask_non_secret_var", () => {
    expect(maskSecretValue("PATH", "/usr/bin:/bin")).toBe("/usr/bin:/bin");
  });
  it("should_fully_mask_short_values", () => {
    expect(maskSecretValue("TOKEN", "abc")).toBe("***");
  });
});

describe("isExecAllowed", () => {
  it("should_return_false_when_unset", () => {
    delete process.env.MCP_SYSTEM_ALLOW_EXEC;
    expect(isExecAllowed()).toBe(false);
  });
  it("should_return_true_when_exactly_true", () => {
    process.env.MCP_SYSTEM_ALLOW_EXEC = "true";
    expect(isExecAllowed()).toBe(true);
    delete process.env.MCP_SYSTEM_ALLOW_EXEC;
  });
  it("should_return_false_for_other_truthy_strings", () => {
    process.env.MCP_SYSTEM_ALLOW_EXEC = "1";
    expect(isExecAllowed()).toBe(false);
    delete process.env.MCP_SYSTEM_ALLOW_EXEC;
  });
});
