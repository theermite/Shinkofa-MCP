import { describe, it, expect } from "vitest";
import { StripeClient, StripeError } from "../src/lib/client.js";

describe("StripeClient", () => {
  it("should throw if no secret key", () => { expect(() => new StripeClient({ secretKey: "" })).toThrow("STRIPE_SECRET_KEY"); });
  it("should construct with key", () => { expect(new StripeClient({ secretKey: "sk_test_123" })).toBeDefined(); });
  it("should construct with custom settings", () => { expect(new StripeClient({ secretKey: "sk_test_123", apiBaseUrl: "https://custom", apiVersion: "2025-01-01", timeoutMs: 5000 })).toBeDefined(); });
});

describe("StripeError", () => {
  it("should create with all properties", () => {
    const e = new StripeError(400, "invalid_request_error", "missing_param", "Missing required param: amount");
    expect(e.httpStatus).toBe(400);
    expect(e.type).toBe("invalid_request_error");
    expect(e.code).toBe("missing_param");
    expect(e.description).toContain("amount");
    expect(e.name).toBe("StripeError");
  });
});
