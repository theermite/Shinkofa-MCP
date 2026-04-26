import { describe, expect, it } from "vitest";
import { HAError } from "../src/lib/client.js";
import { toolError, toolResult, withErrorHandler } from "../src/lib/utils.js";

// ---------------------------------------------------------------------------
// toolResult
// ---------------------------------------------------------------------------

describe("toolResult", () => {
  it("should_return_json_content_when_data_is_an_object", () => {
    const res = toolResult({ state: "on" });
    expect(res.content).toHaveLength(1);
    expect(res.content[0].type).toBe("text");
    expect(res.content[0].text).toBe(JSON.stringify({ state: "on" }, null, 2));
  });

  it("should_return_success_json_when_data_is_undefined", () => {
    const res = toolResult(undefined);
    expect(res.content[0].text).toBe('{"status":"success"}');
  });

  it("should_return_json_array_when_data_is_an_array", () => {
    const res = toolResult([1, 2, 3]);
    expect(JSON.parse(res.content[0].text)).toEqual([1, 2, 3]);
  });

  it("should_not_set_isError_when_returning_data", () => {
    const res = toolResult({ ok: true }) as Record<string, unknown>;
    expect(res.isError).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// toolError
// ---------------------------------------------------------------------------

describe("toolError", () => {
  it("should_set_isError_true_when_called", () => {
    expect(toolError("something went wrong").isError).toBe(true);
  });

  it("should_include_message_in_content_text_when_called", () => {
    const res = toolError("HA is offline");
    expect(res.content[0].text).toBe("HA is offline");
  });

  it("should_set_content_type_to_text_when_called", () => {
    expect(toolError("err").content[0].type).toBe("text");
  });
});

// ---------------------------------------------------------------------------
// withErrorHandler
// ---------------------------------------------------------------------------

describe("withErrorHandler", () => {
  it("should_return_fn_result_when_no_error_is_thrown", async () => {
    const result = await withErrorHandler(async () => toolResult({ ok: true }));
    expect(result).toMatchObject({ content: [{ type: "text" }] });
  });

  it("should_return_toolError_when_HAError_is_thrown", async () => {
    const result = await withErrorHandler(async () => {
      throw new HAError(503, "Service unavailable");
    });
    expect(result).toMatchObject({ isError: true });
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("503");
    expect((result as ReturnType<typeof toolError>).content[0].text).toContain("Service unavailable");
  });

  it("should_return_timeout_error_when_AbortError_is_thrown", async () => {
    const abortErr = new Error("Aborted");
    abortErr.name = "AbortError";
    const result = await withErrorHandler(async () => {
      throw abortErr;
    });
    expect((result as ReturnType<typeof toolError>).content[0].text).toBe("Request timed out");
  });

  it("should_return_network_error_when_TypeError_is_thrown", async () => {
    const netErr = new TypeError("fetch failed");
    const result = await withErrorHandler(async () => {
      throw netErr;
    });
    const text = (result as ReturnType<typeof toolError>).content[0].text;
    expect(text).toContain("Network error");
    expect(text).toContain("fetch failed");
  });

  it("should_rethrow_when_unknown_error_is_thrown", async () => {
    await expect(
      withErrorHandler(async () => {
        throw new RangeError("totally unexpected");
      }),
    ).rejects.toBeInstanceOf(RangeError);
  });

  it("should_rethrow_when_non_Error_value_is_thrown", async () => {
    await expect(
      withErrorHandler(async () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "raw string thrown";
      }),
    ).rejects.toBe("raw string thrown");
  });
});
