import { describe, expect, it } from "vitest";
import { TelegramError } from "../src/lib/client.js";
import { toolError, toolResult, withErrorHandler } from "../src/lib/utils.js";

describe("toolResult", () => {
  it("should_format_data_as_json", () => {
    const result = toolResult({ key: "value" });
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ key: "value" });
  });

  it("should_return_success_for_undefined", () => {
    const result = toolResult(undefined);
    expect(result.content[0].text).toBe('{"status":"success"}');
  });

  it("should_format_null", () => {
    const result = toolResult(null);
    expect(result.content[0].text).toBe("null");
  });

  it("should_pretty_print_json", () => {
    const result = toolResult({ a: 1 });
    expect(result.content[0].text).toContain("\n");
  });
});

describe("toolError", () => {
  it("should_format_error_message", () => {
    const result = toolError("Something failed");
    expect(result.content[0].text).toBe("Something failed");
    expect(result.isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should_return_fn_result_on_success", async () => {
    const result = await withErrorHandler(async () => "ok");
    expect(result).toBe("ok");
  });

  it("should_catch_TelegramError", async () => {
    const result = await withErrorHandler(async () => {
      throw new TelegramError(400, "Bad Request: chat not found");
    });
    expect((result as any).isError).toBe(true);
    expect((result as any).content[0].text).toContain("400");
    expect((result as any).content[0].text).toContain("Bad Request");
  });

  it("should_include_retry_after_in_rate_limit", async () => {
    const result = await withErrorHandler(async () => {
      throw new TelegramError(429, "Too Many Requests", { retry_after: 30 });
    });
    expect((result as any).content[0].text).toContain("retry after 30s");
  });

  it("should_catch_AbortError", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    expect((result as any).content[0].text).toBe("Request timed out");
  });

  it("should_catch_SyntaxError", async () => {
    const result = await withErrorHandler(async () => {
      throw new SyntaxError("Unexpected token");
    });
    expect((result as any).content[0].text).toContain("non-JSON");
  });

  it("should_catch_TypeError", async () => {
    const result = await withErrorHandler(async () => {
      throw new TypeError("fetch failed");
    });
    expect((result as any).content[0].text).toContain("Network error");
  });

  it("should_rethrow_unknown_errors", async () => {
    await expect(
      withErrorHandler(async () => {
        throw new RangeError("out of bounds");
      }),
    ).rejects.toThrow("out of bounds");
  });
});
