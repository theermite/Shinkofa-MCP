import { describe, expect, it } from "vitest";
import { YouTubeError } from "../src/lib/client.js";
import { toolError, toolResult, withErrorHandler } from "../src/lib/utils.js";

describe("toolResult", () => {
  it("should_format_data_as_json_text", () => {
    const result = toolResult({ items: [1, 2] });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ items: [1, 2] });
  });

  it("should_return_success_status_when_undefined", () => {
    const result = toolResult(undefined);
    expect(result.content[0].text).toBe('{"status":"success"}');
  });
});

describe("toolError", () => {
  it("should_format_error_message_with_isError", () => {
    const result = toolError("Something went wrong");
    expect(result.content[0].text).toBe("Something went wrong");
    expect(result.isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should_return_fn_result_on_success", async () => {
    const result = await withErrorHandler(async () => ({ ok: true }));
    expect(result).toEqual({ ok: true });
  });

  it("should_catch_YouTubeError_and_return_toolError", async () => {
    const result = await withErrorHandler(async () => {
      throw new YouTubeError(403, "Forbidden");
    });
    expect(result).toEqual({
      content: [{ type: "text", text: "YouTube error 403: Forbidden" }],
      isError: true,
    });
  });

  it("should_catch_AbortError_and_return_timeout", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    expect(result).toEqual({
      content: [{ type: "text", text: "Request timed out" }],
      isError: true,
    });
  });

  it("should_catch_SyntaxError_and_return_non_json_message", async () => {
    const result = await withErrorHandler(async () => {
      throw new SyntaxError("Unexpected token");
    });
    expect(result).toEqual({
      content: [{ type: "text", text: "Invalid API response (non-JSON)" }],
      isError: true,
    });
  });

  it("should_catch_TypeError_and_return_network_error", async () => {
    const result = await withErrorHandler(async () => {
      throw new TypeError("fetch failed");
    });
    expect(result).toEqual({
      content: [{ type: "text", text: "Network error: fetch failed" }],
      isError: true,
    });
  });

  it("should_rethrow_unknown_errors", async () => {
    await expect(
      withErrorHandler(async () => {
        throw "raw string";
      }),
    ).rejects.toBe("raw string");
  });
});
