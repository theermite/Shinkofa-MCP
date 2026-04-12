import { describe, it, expect } from "vitest";
import { toolResult, toolError, withErrorHandler } from "../src/lib/utils.js";

describe("toolResult", () => {
  it("should_serialize_object_when_given_object", () => {
    const r = toolResult({ status: "success", output: "out.mp4" });
    expect(r.content[0].text).toBe(JSON.stringify({ status: "success", output: "out.mp4" }, null, 2));
  });

  it("should_return_success_when_data_is_undefined", () => {
    const r = toolResult(undefined);
    expect(r.content[0].text).toBe('{"status":"success"}');
  });

  it("should_return_string_directly_when_given_string", () => {
    const r = toolResult("some text output");
    expect(r.content[0].text).toBe("some text output");
  });

  it("should_serialize_null_when_given_null", () => {
    const r = toolResult(null);
    expect(r.content[0].text).toBe("null");
  });
});

describe("toolError", () => {
  it("should_return_error_with_message", () => {
    const r = toolError("FFmpeg failed");
    expect(r.content[0].text).toBe("FFmpeg failed");
    expect(r.isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should_return_result_when_fn_succeeds", async () => {
    const r = await withErrorHandler(() => Promise.resolve({ content: [{ type: "text" as const, text: "ok" }] }));
    expect(r).toEqual({ content: [{ type: "text", text: "ok" }] });
  });

  it("should_catch_Error_and_return_toolError", async () => {
    const r = await withErrorHandler(() => { throw new Error("Input file not found or not readable: test.mp4"); });
    expect(r).toEqual({ content: [{ type: "text", text: "FFmpeg error: Input file not found or not readable: test.mp4" }], isError: true });
  });

  it("should_catch_timeout_error", async () => {
    const r = await withErrorHandler(() => { throw new Error("Process timed out after 300000ms"); });
    expect(r).toEqual({ content: [{ type: "text", text: "FFmpeg error: Process timed out after 300000ms" }], isError: true });
  });

  it("should_catch_spawn_error", async () => {
    const r = await withErrorHandler(() => { throw new Error("Failed to spawn ffmpeg: ENOENT"); });
    expect(r).toEqual({ content: [{ type: "text", text: "FFmpeg error: Failed to spawn ffmpeg: ENOENT" }], isError: true });
  });

  it("should_rethrow_non_Error_values", async () => {
    await expect(withErrorHandler(() => { throw "string error"; })).rejects.toBe("string error");
  });
});
