import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { createErrorHandler, toolError, toolResult } from "../src/index.js";
import type { ToolResponse } from "../src/index.js";

function isValidToolResponse(r: ToolResponse): boolean {
  return (
    Array.isArray(r.content) &&
    r.content.length === 1 &&
    r.content[0].type === "text" &&
    typeof r.content[0].text === "string"
  );
}

describe("toolResult — PBT", () => {
  it("should_always_produce_valid_ToolResponse_for_any_json_value", () => {
    fc.assert(
      fc.property(fc.jsonValue(), (data) => {
        const result = toolResult(data);
        expect(isValidToolResponse(result)).toBe(true);
        expect(result.isError).toBeUndefined();
      }),
    );
  });

  it("should_always_produce_parseable_json_text", () => {
    fc.assert(
      fc.property(fc.jsonValue(), (data) => {
        const result = toolResult(data);
        expect(() => JSON.parse(result.content[0].text)).not.toThrow();
      }),
    );
  });

  it("should_roundtrip_json_objects", () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1 }), fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))),
        (obj) => {
          const result = toolResult(obj);
          const parsed = JSON.parse(result.content[0].text);
          expect(parsed).toEqual(obj);
        },
      ),
    );
  });

  it("should_return_success_sentinel_only_for_undefined", () => {
    const sentinel = '{"status":"success"}';
    fc.assert(
      fc.property(fc.jsonValue(), (data) => {
        const result = toolResult(data);
        expect(result.content[0].text).not.toBe(sentinel);
      }),
    );
    expect(toolResult(undefined).content[0].text).toBe(sentinel);
  });
});

describe("toolError — PBT", () => {
  it("should_always_set_isError_true_for_any_string", () => {
    fc.assert(
      fc.property(fc.string(), (msg) => {
        const result = toolError(msg);
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe(msg);
      }),
    );
  });

  it("should_preserve_message_exactly_for_any_unicode", () => {
    fc.assert(
      fc.property(fc.string(), (msg) => {
        const result = toolError(msg);
        expect(result.content[0].text).toBe(msg);
      }),
    );
  });
});

describe("createErrorHandler — PBT", () => {
  it("should_always_rethrow_non_Error_values_when_no_formatter", async () => {
    const handler = createErrorHandler();
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
        async (value) => {
          await expect(handler(async () => { throw value; })).rejects.toBe(value);
        },
      ),
    );
  });

  it("should_always_include_message_in_TypeError_response", async () => {
    const handler = createErrorHandler();
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (msg) => {
        const result = await handler(async () => { throw new TypeError(msg); });
        expect((result as ToolResponse).content[0].text).toBe(`Network error: ${msg}`);
        expect((result as ToolResponse).isError).toBe(true);
      }),
    );
  });

  it("should_give_formatter_priority_over_builtin_handlers", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (customMsg) => {
        const handler = createErrorHandler(() => customMsg);
        const abortErr = new Error("x");
        abortErr.name = "AbortError";
        const result = await handler(async () => { throw abortErr; });
        expect((result as ToolResponse).content[0].text).toBe(customMsg);
      }),
    );
  });

  it("should_fall_through_when_formatter_returns_undefined", async () => {
    const handler = createErrorHandler(() => undefined);
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (msg) => {
        const err = new Error(msg);
        err.name = "AbortError";
        const result = await handler(async () => { throw err; });
        expect((result as ToolResponse).content[0].text).toBe("Request timed out");
      }),
    );
  });
});
