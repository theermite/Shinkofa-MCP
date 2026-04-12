import { describe, it, expect } from "vitest";
import { toolResult, toolError, withErrorHandler } from "../src/lib/utils.js";
import { OBSError } from "../src/lib/client.js";

describe("toolResult", () => {
  it("should_return_success_json_when_data_is_undefined", () => {
    const result = toolResult(undefined);
    expect(result.content[0]!.text).toBe('{"status":"success"}');
  });

  it("should_stringify_object_data", () => {
    const result = toolResult({ scenes: ["Main", "BRB"] });
    expect(JSON.parse(result.content[0]!.text)).toEqual({ scenes: ["Main", "BRB"] });
  });

  it("should_return_string_data_as_is", () => {
    const result = toolResult("hello");
    expect(result.content[0]!.text).toBe("hello");
  });

  it("should_return_null_as_json", () => {
    const result = toolResult(null);
    expect(result.content[0]!.text).toBe("null");
  });
});

describe("toolError", () => {
  it("should_return_error_with_isError_flag", () => {
    const result = toolError("OBS disconnected");
    expect(result.content[0]!.text).toBe("OBS disconnected");
    expect(result.isError).toBe(true);
  });
});

describe("withErrorHandler", () => {
  it("should_return_fn_result_on_success", async () => {
    const result = await withErrorHandler(async () => toolResult({ ok: true }));
    expect(result).toEqual(toolResult({ ok: true }));
  });

  it("should_catch_OBSError_and_return_toolError", async () => {
    const result = await withErrorHandler(async () => {
      throw new OBSError("connection refused");
    });
    expect(result).toHaveProperty("isError", true);
    expect(result.content[0]!.text).toContain("OBS error: connection refused");
  });

  it("should_catch_generic_Error_and_return_toolError", async () => {
    const result = await withErrorHandler(async () => {
      throw new Error("generic failure");
    });
    expect(result).toHaveProperty("isError", true);
    expect(result.content[0]!.text).toContain("Error: generic failure");
  });

  it("should_rethrow_non_Error_values", async () => {
    await expect(
      withErrorHandler(async () => {
        throw "string error";
      }),
    ).rejects.toBe("string error");
  });

  it("should_distinguish_OBSError_from_generic_Error", async () => {
    const obsResult = await withErrorHandler(async () => {
      throw new OBSError("ws closed");
    });
    const genResult = await withErrorHandler(async () => {
      throw new TypeError("bad type");
    });
    expect(obsResult.content[0]!.text).toMatch(/^OBS error:/);
    expect(genResult.content[0]!.text).toMatch(/^Error:/);
  });
});
