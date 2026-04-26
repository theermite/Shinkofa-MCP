import { describe, expect, it } from "vitest";
import { LinkedInError } from "../src/lib/client.js";
import { toolError, toolResult, withErrorHandler } from "../src/lib/utils.js";

describe("toolResult", () => {
  it("should_format_data_as_json", () => {
    const result = toolResult({ id: "1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "1" });
  });

  it("should_return_success_for_undefined", () => {
    expect(toolResult(undefined).content[0].text).toBe('{"status":"success"}');
  });
});

describe("toolError", () => {
  it("should_return_error_with_flag", () => {
    const r = toolError("fail");
    expect(r.isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should_pass_through_success", async () => {
    expect(await withErrorHandler(async () => 42)).toBe(42);
  });

  it("should_catch_LinkedInError", async () => {
    const r = await withErrorHandler(async () => {
      throw new LinkedInError(400, "bad");
    });
    expect(r).toHaveProperty("isError", true);
  });

  it("should_include_rate_limit_hint_on_429", async () => {
    const r = await withErrorHandler(async () => {
      throw new LinkedInError(429, "Too many requests");
    });
    expect((r as { content: { text: string }[] }).content[0].text).toContain("rate limited");
  });

  it("should_catch_AbortError", async () => {
    const r = await withErrorHandler(async () => {
      const e = new Error("abort");
      e.name = "AbortError";
      throw e;
    });
    expect((r as { content: { text: string }[] }).content[0].text).toContain("timed out");
  });

  it("should_rethrow_unknown", async () => {
    await expect(
      withErrorHandler(async () => {
        throw new RangeError("x");
      }),
    ).rejects.toThrow(RangeError);
  });
});
