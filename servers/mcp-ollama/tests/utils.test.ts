import { describe, it, expect } from "vitest";
import { toolResult, toolError, withErrorHandler } from "../src/lib/utils.js";
import { OllamaError } from "../src/lib/client.js";

describe("toolResult", () => {
  it("should_format_data_as_json_text", () => {
    const result = toolResult({ models: [] });
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ models: [] });
  });

  it("should_return_success_for_undefined", () => {
    const result = toolResult(undefined);
    expect(result.content[0].text).toBe('{"status":"success"}');
  });
});

describe("toolError", () => {
  it("should_return_error_with_flag", () => {
    const result = toolError("something broke");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("something broke");
  });
});

describe("withErrorHandler", () => {
  it("should_return_fn_result_on_success", async () => {
    const result = await withErrorHandler(async () => ({ data: 1 }));
    expect(result).toEqual({ data: 1 });
  });

  it("should_catch_OllamaError", async () => {
    const result = await withErrorHandler(async () => {
      throw new OllamaError(404, "model not found");
    });
    expect(result).toHaveProperty("isError", true);
    expect((result as { content: { text: string }[] }).content[0].text).toContain("404");
  });

  it("should_catch_AbortError", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    expect(result).toHaveProperty("isError", true);
    expect((result as { content: { text: string }[] }).content[0].text).toContain("timed out");
  });

  it("should_catch_TypeError_as_network_error", async () => {
    const result = await withErrorHandler(async () => {
      throw new TypeError("fetch failed");
    });
    expect(result).toHaveProperty("isError", true);
    expect((result as { content: { text: string }[] }).content[0].text).toContain("Network error");
  });

  it("should_catch_SyntaxError_as_non_json", async () => {
    const result = await withErrorHandler(async () => {
      throw new SyntaxError("Unexpected token");
    });
    expect(result).toHaveProperty("isError", true);
    expect((result as { content: { text: string }[] }).content[0].text).toContain("non-JSON");
  });

  it("should_rethrow_unknown_errors", async () => {
    await expect(
      withErrorHandler(async () => {
        throw new RangeError("out of range");
      }),
    ).rejects.toThrow(RangeError);
  });
});
