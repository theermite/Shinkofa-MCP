import { describe, expect, it } from "vitest";
import { DevtoError } from "../src/lib/client.js";
import { toolError, toolResult, withErrorHandler } from "../src/lib/utils.js";

describe("toolResult", () => {
  it("should_format_data_as_json_text", () => {
    const result = toolResult({ id: 1 });
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ id: 1 });
  });

  it("should_return_success_for_undefined", () => {
    const result = toolResult(undefined);
    expect(result.content[0].text).toBe('{"status":"success"}');
  });
});

describe("toolError", () => {
  it("should_return_error_with_flag", () => {
    const result = toolError("fail");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("fail");
  });
});

describe("withErrorHandler", () => {
  it("should_return_fn_result_on_success", async () => {
    const result = await withErrorHandler(async () => ({ id: 1 }));
    expect(result).toEqual({ id: 1 });
  });

  it("should_catch_DevtoError", async () => {
    const result = await withErrorHandler(async () => {
      throw new DevtoError(401, "unauthorized");
    });
    expect(result).toHaveProperty("isError", true);
  });

  it("should_catch_rate_limit_DevtoError", async () => {
    const result = await withErrorHandler(async () => {
      throw new DevtoError(429, "Too many requests");
    });
    const r = result as { content: { text: string }[] };
    expect(r.content[0].text).toContain("rate limited");
  });

  it("should_catch_AbortError", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    expect(result).toHaveProperty("isError", true);
  });

  it("should_rethrow_unknown_errors", async () => {
    await expect(
      withErrorHandler(async () => {
        throw new RangeError("bad");
      }),
    ).rejects.toThrow(RangeError);
  });
});
