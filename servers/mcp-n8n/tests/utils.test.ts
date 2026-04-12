import { describe, it, expect } from "vitest";
import { toolResult, toolError, withErrorHandler } from "../src/lib/utils.js";
import { N8nError } from "../src/lib/client.js";

describe("toolResult", () => {
  it("should_serialize_data_when_given_object", () => {
    const r = toolResult({ id: 1, name: "test" });
    expect(r.content[0].text).toBe(JSON.stringify({ id: 1, name: "test" }, null, 2));
  });

  it("should_return_success_when_data_is_undefined", () => {
    const r = toolResult(undefined);
    expect(r.content[0].text).toBe('{"status":"success"}');
  });

  it("should_serialize_array_when_given_array", () => {
    const r = toolResult([1, 2, 3]);
    expect(r.content[0].text).toBe(JSON.stringify([1, 2, 3], null, 2));
  });

  it("should_serialize_null_when_given_null", () => {
    const r = toolResult(null);
    expect(r.content[0].text).toBe("null");
  });
});

describe("toolError", () => {
  it("should_return_error_with_message", () => {
    const r = toolError("something broke");
    expect(r.content[0].text).toBe("something broke");
    expect(r.isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should_return_result_when_fn_succeeds", async () => {
    const r = await withErrorHandler(() => Promise.resolve({ content: [{ type: "text" as const, text: "ok" }] }));
    expect(r).toEqual({ content: [{ type: "text", text: "ok" }] });
  });

  it("should_catch_N8nError_and_return_toolError", async () => {
    const r = await withErrorHandler(() => { throw new N8nError(404, "Workflow not found"); });
    expect(r).toEqual({ content: [{ type: "text", text: "n8n error 404: Workflow not found" }], isError: true });
  });

  it("should_catch_AbortError_and_return_timeout", async () => {
    const err = new Error("The operation was aborted");
    err.name = "AbortError";
    const r = await withErrorHandler(() => { throw err; });
    expect(r).toEqual({ content: [{ type: "text", text: "Request timed out" }], isError: true });
  });

  it("should_catch_TypeError_and_return_network_error", async () => {
    const r = await withErrorHandler(() => { throw new TypeError("fetch failed"); });
    expect(r).toEqual({ content: [{ type: "text", text: "Network error: fetch failed" }], isError: true });
  });

  it("should_catch_SyntaxError_and_return_non_json_error", async () => {
    const r = await withErrorHandler(() => { throw new SyntaxError("Unexpected token"); });
    expect(r).toEqual({ content: [{ type: "text", text: "Invalid response from n8n API (non-JSON)" }], isError: true });
  });

  it("should_rethrow_unknown_errors", async () => {
    await expect(withErrorHandler(() => { throw new RangeError("boom"); })).rejects.toThrow("boom");
  });
});
