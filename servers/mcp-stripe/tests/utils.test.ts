import { describe, it, expect } from "vitest";
import { toolResult, toolError, withErrorHandler } from "../src/lib/utils.js";
import { StripeError } from "../src/lib/client.js";

describe("toolResult", () => {
  it("should_format_data_as_JSON_text", () => {
    const result = toolResult({ id: "cus_123", name: "Jay" });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({
      id: "cus_123",
      name: "Jay",
    });
  });

  it("should_return_success_status_when_undefined", () => {
    const result = toolResult(undefined);
    expect(result.content[0].text).toBe('{"status":"success"}');
  });

  it("should_handle_null_data", () => {
    const result = toolResult(null);
    expect(result.content[0].text).toBe("null");
  });

  it("should_handle_array_data", () => {
    const result = toolResult([1, 2, 3]);
    expect(JSON.parse(result.content[0].text)).toEqual([1, 2, 3]);
  });

  it("should_handle_empty_object", () => {
    const result = toolResult({});
    expect(JSON.parse(result.content[0].text)).toEqual({});
  });

  it("should_pretty_print_JSON", () => {
    const result = toolResult({ a: 1 });
    expect(result.content[0].text).toContain("\n");
  });
});

describe("toolError", () => {
  it("should_return_error_with_isError_flag", () => {
    const result = toolError("Something went wrong");
    expect(result.content[0].text).toBe("Something went wrong");
    expect(result.isError).toBe(true);
  });

  it("should_return_single_content_item", () => {
    const result = toolError("err");
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
  });
});

describe("withErrorHandler", () => {
  it("should_return_fn_result_when_success", async () => {
    const result = await withErrorHandler(async () => ({
      content: [{ type: "text" as const, text: "ok" }],
    }));
    expect(result).toEqual({
      content: [{ type: "text", text: "ok" }],
    });
  });

  it("should_catch_StripeError_when_thrown", async () => {
    const result = await withErrorHandler(async () => {
      throw new StripeError(
        404,
        "invalid_request_error",
        "resource_missing",
        "No such customer",
      );
    });
    expect(result).toHaveProperty("isError", true);
    expect((result as { content: { text: string }[] }).content[0].text).toContain(
      "Stripe error 404",
    );
    expect((result as { content: { text: string }[] }).content[0].text).toContain(
      "resource_missing",
    );
  });

  it("should_catch_StripeError_without_code", async () => {
    const result = await withErrorHandler(async () => {
      throw new StripeError(
        500,
        "api_error",
        undefined,
        "Internal error",
      );
    });
    expect((result as { content: { text: string }[] }).content[0].text).toContain(
      "api_error",
    );
    expect((result as { content: { text: string }[] }).content[0].text).not.toContain(
      "undefined",
    );
  });

  it("should_catch_AbortError_when_timeout", async () => {
    const result = await withErrorHandler(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    expect(result).toHaveProperty("isError", true);
    expect((result as { content: { text: string }[] }).content[0].text).toBe(
      "Request timed out",
    );
  });

  it("should_catch_SyntaxError_when_non_JSON", async () => {
    const result = await withErrorHandler(async () => {
      throw new SyntaxError("Unexpected token");
    });
    expect(result).toHaveProperty("isError", true);
    expect((result as { content: { text: string }[] }).content[0].text).toContain(
      "non-JSON",
    );
  });

  it("should_catch_TypeError_when_network_error", async () => {
    const result = await withErrorHandler(async () => {
      throw new TypeError("fetch failed");
    });
    expect(result).toHaveProperty("isError", true);
    expect((result as { content: { text: string }[] }).content[0].text).toContain(
      "Network error",
    );
  });

  it("should_rethrow_unknown_errors", async () => {
    await expect(
      withErrorHandler(async () => {
        throw new RangeError("out of range");
      }),
    ).rejects.toThrow(RangeError);
  });
});
