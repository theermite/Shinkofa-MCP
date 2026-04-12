import { describe, it, expect } from "vitest";
import { toolResult, toolError, withErrorHandler } from "../src/lib/utils.js";

describe("toolResult", () => {
  it("should_serialize_data_when_given_object", () => {
    const r = toolResult({ output: "test.webp" });
    expect(r.content[0].text).toBe(JSON.stringify({ output: "test.webp" }, null, 2));
  });

  it("should_return_success_when_data_is_undefined", () => {
    const r = toolResult(undefined);
    expect(r.content[0].text).toBe('{"status":"success"}');
  });

  it("should_serialize_array_when_given_array", () => {
    const r = toolResult(["a.png", "b.png"]);
    expect(r.content[0].text).toBe(JSON.stringify(["a.png", "b.png"], null, 2));
  });
});

describe("toolError", () => {
  it("should_return_error_with_message", () => {
    const r = toolError("magick: unable to open file");
    expect(r.content[0].text).toBe("magick: unable to open file");
    expect(r.isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should_return_result_when_fn_succeeds", async () => {
    const r = await withErrorHandler(() => Promise.resolve({ content: [{ type: "text" as const, text: "ok" }] }));
    expect(r).toEqual({ content: [{ type: "text", text: "ok" }] });
  });

  it("should_catch_Error_and_return_toolError", async () => {
    const r = await withErrorHandler(() => { throw new Error("ENOENT: magick not found"); });
    expect(r).toEqual({ content: [{ type: "text", text: "ImageMagick error: ENOENT: magick not found" }], isError: true });
  });

  it("should_catch_TypeError_and_return_toolError", async () => {
    const r = await withErrorHandler(() => { throw new TypeError("Cannot read properties of null"); });
    expect(r).toEqual({ content: [{ type: "text", text: "ImageMagick error: Cannot read properties of null" }], isError: true });
  });

  it("should_rethrow_non_Error_values", async () => {
    await expect(withErrorHandler(() => { throw "string error"; })).rejects.toBe("string error");
  });
});
