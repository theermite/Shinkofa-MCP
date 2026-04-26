import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StripeClient, StripeError } from "../src/lib/client.js";

// --- Helpers ---

function mockFetch(body: unknown, status = 200, ok = true, jsonFails = false) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: "OK",
    json: jsonFails ? () => Promise.reject(new SyntaxError("Unexpected token")) : () => Promise.resolve(body),
  } as unknown as Response);
}

describe("StripeClient — constructor", () => {
  it("should throw if no secret key", () => {
    expect(() => new StripeClient({ secretKey: "" })).toThrow("STRIPE_SECRET_KEY");
  });

  it("should construct with key", () => {
    expect(new StripeClient({ secretKey: "sk_test_123" })).toBeDefined();
  });

  it("should construct with custom settings", () => {
    const c = new StripeClient({
      secretKey: "sk_test_123",
      apiBaseUrl: "https://custom.stripe.com/v1",
      apiVersion: "2025-01-01",
      timeoutMs: 5000,
    });
    expect(c).toBeDefined();
  });
});

describe("StripeClient — callApi", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should_make_GET_request_when_no_params", async () => {
    globalThis.fetch = mockFetch({ id: "cus_123" });
    const client = new StripeClient({ secretKey: "sk_test_x" });
    const result = await client.callApi("GET", "/customers/cus_123");
    expect(result).toEqual({ id: "cus_123" });
    expect(globalThis.fetch).toHaveBeenCalledOnce();

    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.stripe.com/v1/customers/cus_123");
    expect(opts.method).toBe("GET");
    expect(opts.headers.Authorization).toBe("Bearer sk_test_x");
    expect(opts.headers["Stripe-Version"]).toBeDefined();
  });

  it("should_append_query_params_when_GET_with_params", async () => {
    globalThis.fetch = mockFetch({ data: [] });
    const client = new StripeClient({ secretKey: "sk_test_x" });
    await client.callApi("GET", "/customers", { limit: 10 });

    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("?limit=10");
  });

  it("should_send_form_encoded_body_when_POST", async () => {
    globalThis.fetch = mockFetch({ id: "cus_new" });
    const client = new StripeClient({ secretKey: "sk_test_x" });
    await client.callApi("POST", "/customers", {
      email: "jay@shinkofa.com",
    });

    const [, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(opts.body).toContain("email=jay%40shinkofa.com");
  });

  it("should_strip_null_and_undefined_params", async () => {
    globalThis.fetch = mockFetch({ id: "cus_123" });
    const client = new StripeClient({ secretKey: "sk_test_x" });
    await client.callApi("POST", "/customers", {
      email: "jay@test.com",
      name: null,
      phone: undefined,
    });

    const [, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.body).not.toContain("name");
    expect(opts.body).not.toContain("phone");
  });

  it("should_throw_StripeError_when_response_not_ok", async () => {
    globalThis.fetch = mockFetch(
      {
        error: {
          type: "invalid_request_error",
          code: "resource_missing",
          message: "No such customer",
        },
      },
      404,
      false,
    );
    const client = new StripeClient({ secretKey: "sk_test_x" });

    await expect(client.callApi("GET", "/customers/cus_xxx")).rejects.toThrow(StripeError);

    try {
      await client.callApi("GET", "/customers/cus_xxx");
    } catch (e) {
      const err = e as StripeError;
      expect(err.httpStatus).toBe(404);
      expect(err.type).toBe("invalid_request_error");
      expect(err.code).toBe("resource_missing");
      expect(err.description).toBe("No such customer");
    }
  });

  it("should_handle_non_JSON_response_when_502", async () => {
    globalThis.fetch = mockFetch(null, 502, false, true);
    const client = new StripeClient({ secretKey: "sk_test_x" });

    await expect(client.callApi("GET", "/customers")).rejects.toThrow(StripeError);

    try {
      await client.callApi("GET", "/customers");
    } catch (e) {
      const err = e as StripeError;
      expect(err.httpStatus).toBe(502);
      expect(err.description).toContain("Non-JSON");
    }
  });

  it("should_return_undefined_when_204_response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: "No Content",
    } as unknown as Response);

    const client = new StripeClient({ secretKey: "sk_test_x" });
    const result = await client.callApi("DELETE", "/customers/cus_123");
    expect(result).toBeUndefined();
  });

  it("should_throw_AbortError_when_timeout", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        const err = new Error("aborted");
        err.name = "AbortError";
        setTimeout(() => reject(err), 10);
      });
    });

    const client = new StripeClient({
      secretKey: "sk_test_x",
      timeoutMs: 5,
    });

    await expect(client.callApi("GET", "/customers")).rejects.toThrow();
  });

  it("should_throw_TypeError_when_network_error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    const client = new StripeClient({ secretKey: "sk_test_x" });
    await expect(client.callApi("GET", "/customers")).rejects.toThrow(TypeError);
  });
});

describe("StripeClient — flattenParams", () => {
  const client = new StripeClient({ secretKey: "sk_test_x" });

  it("should_flatten_simple_params", () => {
    const result = client.flattenParams({
      email: "jay@test.com",
      limit: 10,
    });
    expect(result).toEqual([
      ["email", "jay@test.com"],
      ["limit", "10"],
    ]);
  });

  it("should_flatten_nested_objects", () => {
    const result = client.flattenParams({
      metadata: { key1: "val1", key2: "val2" },
    });
    expect(result).toEqual([
      ["metadata[key1]", "val1"],
      ["metadata[key2]", "val2"],
    ]);
  });

  it("should_flatten_arrays", () => {
    const result = client.flattenParams({
      expand: ["customer", "invoice"],
    });
    expect(result).toEqual([
      ["expand[0]", "customer"],
      ["expand[1]", "invoice"],
    ]);
  });

  it("should_flatten_array_of_objects", () => {
    const result = client.flattenParams({
      items: [{ price: "price_123", quantity: 1 }],
    });
    expect(result).toContainEqual(["items[0][price]", "price_123"]);
    expect(result).toContainEqual(["items[0][quantity]", "1"]);
  });

  it("should_skip_null_and_undefined", () => {
    const result = client.flattenParams({
      email: "test@test.com",
      name: null,
      phone: undefined,
    });
    expect(result).toEqual([["email", "test@test.com"]]);
  });

  it("should_handle_deeply_nested", () => {
    const result = client.flattenParams({
      a: { b: { c: "deep" } },
    });
    expect(result).toEqual([["a[b][c]", "deep"]]);
  });

  it("should_handle_boolean_values", () => {
    const result = client.flattenParams({ active: true });
    expect(result).toEqual([["active", "true"]]);
  });

  it("should_return_empty_for_empty_object", () => {
    expect(client.flattenParams({})).toEqual([]);
  });
});

describe("StripeError", () => {
  it("should_create_with_all_properties", () => {
    const e = new StripeError(400, "invalid_request_error", "missing_param", "Missing required param: amount");
    expect(e.httpStatus).toBe(400);
    expect(e.type).toBe("invalid_request_error");
    expect(e.code).toBe("missing_param");
    expect(e.description).toContain("amount");
    expect(e.name).toBe("StripeError");
  });

  it("should_format_message_without_code", () => {
    const e = new StripeError(500, "api_error", undefined, "Internal error");
    expect(e.message).toContain("api_error");
    expect(e.message).not.toContain("/");
  });

  it("should_format_message_with_code", () => {
    const e = new StripeError(402, "card_error", "card_declined", "Card was declined");
    expect(e.message).toContain("card_error/card_declined");
  });
});
