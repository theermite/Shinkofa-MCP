import { describe, expect, it } from "vitest";
import type { ToolResponse } from "../src/index.js";
import { createErrorHandler, toolError, toolResult } from "../src/index.js";

describe("toolResult", () => {
  it("should_return_success_json_when_data_is_undefined", () => {
    const result = toolResult(undefined);
    expect(result).toEqual({
      content: [{ type: "text", text: '{"status":"success"}' }],
    });
  });

  it("should_return_pretty_json_when_data_is_object", () => {
    const result = toolResult({ id: 1, name: "test" });
    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify({ id: 1, name: "test" }, null, 2) }],
    });
  });

  it("should_return_json_string_when_data_is_string", () => {
    const result = toolResult("hello");
    expect(result).toEqual({
      content: [{ type: "text", text: '"hello"' }],
    });
  });

  it("should_return_json_number_when_data_is_number", () => {
    const result = toolResult(42);
    expect(result).toEqual({
      content: [{ type: "text", text: "42" }],
    });
  });

  it("should_return_json_array_when_data_is_array", () => {
    const result = toolResult([1, 2, 3]);
    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify([1, 2, 3], null, 2) }],
    });
  });

  it("should_not_set_isError_flag", () => {
    const result = toolResult({ ok: true });
    expect(result).not.toHaveProperty("isError");
  });
});

describe("toolError", () => {
  it("should_return_error_with_message_and_flag", () => {
    const result = toolError("Something went wrong");
    expect(result).toEqual({
      content: [{ type: "text", text: "Something went wrong" }],
      isError: true,
    });
  });

  it("should_handle_empty_message", () => {
    const result = toolError("");
    expect(result).toEqual({
      content: [{ type: "text", text: "" }],
      isError: true,
    });
  });
});

describe("createErrorHandler", () => {
  it("should_return_fn_result_when_no_error", async () => {
    const handler = createErrorHandler();
    const result = await handler(async () => toolResult({ id: 1 }));
    expect(result).toEqual(toolResult({ id: 1 }));
  });

  it("should_catch_abort_error_as_timeout", async () => {
    const handler = createErrorHandler();
    const result = await handler(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    expect(result).toEqual(toolError("Request timed out"));
  });

  it("should_catch_syntax_error_as_invalid_json", async () => {
    const handler = createErrorHandler();
    const result = await handler(async () => {
      throw new SyntaxError("Unexpected token");
    });
    expect(result).toEqual(toolError("Invalid API response (non-JSON)"));
  });

  it("should_catch_type_error_as_network_error", async () => {
    const handler = createErrorHandler();
    const result = await handler(async () => {
      throw new TypeError("fetch failed");
    });
    expect(result).toEqual(toolError("Network error: fetch failed"));
  });

  it("should_rethrow_unknown_errors", async () => {
    const handler = createErrorHandler();
    await expect(
      handler(async () => {
        throw new RangeError("out of bounds");
      }),
    ).rejects.toThrow("out of bounds");
  });

  it("should_rethrow_non_error_throws", async () => {
    const handler = createErrorHandler();
    await expect(
      handler(async () => {
        throw "raw string";
      }),
    ).rejects.toBe("raw string");
  });

  it("should_use_custom_formatter_when_it_returns_message", async () => {
    class CustomApiError extends Error {
      constructor(
        public code: number,
        public description: string,
      ) {
        super(description);
      }
    }

    const handler = createErrorHandler((error) => {
      if (error instanceof CustomApiError) {
        return `API error ${error.code}: ${error.description}`;
      }
    });

    const result = await handler(async () => {
      throw new CustomApiError(404, "Not found");
    });
    expect(result).toEqual(toolError("API error 404: Not found"));
  });

  it("should_fall_through_to_common_handler_when_formatter_returns_undefined", async () => {
    const handler = createErrorHandler(() => undefined);
    const result = await handler(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    expect(result).toEqual(toolError("Request timed out"));
  });

  it("should_fall_through_to_rethrow_when_formatter_returns_undefined_for_unknown", async () => {
    const handler = createErrorHandler(() => undefined);
    await expect(
      handler(async () => {
        throw new RangeError("boom");
      }),
    ).rejects.toThrow("boom");
  });
});

describe("ToolResponse type", () => {
  it("should_be_compatible_with_mcp_sdk_call_tool_result", () => {
    const success: ToolResponse = toolResult({ data: true });
    const error: ToolResponse = toolError("fail");

    expect(success.content[0]?.type).toBe("text");
    expect(success.isError).toBeUndefined();
    expect(error.content[0]?.type).toBe("text");
    expect(error.isError).toBe(true);
  });
});
