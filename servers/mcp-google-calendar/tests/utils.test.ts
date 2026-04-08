import { describe, it, expect } from "vitest";
import { toolResult, toolError, withErrorHandler } from "../src/lib/utils.js";
import { GoogleCalendarError } from "../src/lib/client.js";

// ── toolResult ────────────────────────────────────────────────────────────────

describe("toolResult", () => {
  it("should_serialize_object_data_as_indented_json", () => {
    const result = toolResult({ id: "primary", kind: "calendar#calendar" });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe(JSON.stringify({ id: "primary", kind: "calendar#calendar" }, null, 2));
  });

  it("should_serialize_array_data_correctly", () => {
    const result = toolResult([{ id: "a" }, { id: "b" }]);
    expect(result.content[0].text).toBe(JSON.stringify([{ id: "a" }, { id: "b" }], null, 2));
  });

  it("should_return_success_sentinel_when_data_is_undefined", () => {
    const result = toolResult(undefined);
    expect(result.content[0].text).toBe('{"status":"success"}');
  });

  it("should_not_set_isError_flag", () => {
    const result = toolResult({ ok: true });
    expect((result as { isError?: boolean }).isError).toBeUndefined();
  });

  it("should_serialize_string_data", () => {
    const result = toolResult("hello");
    expect(result.content[0].text).toBe('"hello"');
  });

  it("should_serialize_null_as_json_null", () => {
    const result = toolResult(null);
    expect(result.content[0].text).toBe("null");
  });
});

// ── toolError ─────────────────────────────────────────────────────────────────

describe("toolError", () => {
  it("should_return_message_as_text_content", () => {
    const result = toolError("Something went wrong");
    expect(result.content[0].text).toBe("Something went wrong");
  });

  it("should_set_isError_to_true", () => {
    const result = toolError("Network error: ECONNREFUSED");
    expect(result.isError).toBe(true);
  });

  it("should_set_content_type_to_text", () => {
    const result = toolError("API error");
    expect(result.content[0].type).toBe("text");
  });
});

// ── withErrorHandler ──────────────────────────────────────────────────────────

describe("withErrorHandler", () => {
  it("should_return_function_result_on_success", async () => {
    const result = await withErrorHandler(async () => toolResult({ id: "primary" }));
    expect(result).toEqual(toolResult({ id: "primary" }));
  });

  it("should_catch_GoogleCalendarError_and_return_toolError", async () => {
    const result = await withErrorHandler(async () => {
      throw new GoogleCalendarError(403, "Insufficient Permission");
    });
    expect(result).toEqual(toolError("Google Calendar error 403: Insufficient Permission"));
  });

  it("should_return_timeout_message_for_AbortError", async () => {
    const abortError = new Error("The operation was aborted.");
    abortError.name = "AbortError";
    const result = await withErrorHandler(async () => { throw abortError; });
    expect(result).toEqual(toolError("Request timed out"));
  });

  it("should_return_non_json_message_for_SyntaxError", async () => {
    const syntaxError = new SyntaxError("Unexpected token < in JSON");
    const result = await withErrorHandler(async () => { throw syntaxError; });
    expect(result).toEqual(toolError("Invalid response from Google Calendar API (non-JSON)"));
  });

  it("should_return_network_error_message_for_TypeError", async () => {
    const typeError = new TypeError("Failed to fetch");
    const result = await withErrorHandler(async () => { throw typeError; });
    expect(result).toEqual(toolError("Network error: Failed to fetch"));
  });

  it("should_rethrow_unknown_errors", async () => {
    const unknownError = { weirdObject: true };
    await expect(withErrorHandler(async () => { throw unknownError; })).rejects.toBe(unknownError);
  });

  it("should_rethrow_plain_Error_without_special_name", async () => {
    const plainError = new Error("some unexpected error");
    // name is "Error" — none of the special cases apply
    await expect(withErrorHandler(async () => { throw plainError; })).rejects.toThrow("some unexpected error");
  });
});
