import { describe, it, expect } from "vitest";
import { GoogleCalendarClient, GoogleCalendarError } from "../src/lib/client.js";

describe("GoogleCalendarClient", () => {
  it("should throw if no token", () => { expect(() => new GoogleCalendarClient({ accessToken: "" })).toThrow("GOOGLE_ACCESS_TOKEN"); });
  it("should construct with token", () => { expect(new GoogleCalendarClient({ accessToken: "ya29.test" })).toBeDefined(); });
  it("should construct with custom settings", () => { expect(new GoogleCalendarClient({ accessToken: "ya29.test", apiBaseUrl: "https://custom", timeoutMs: 5000 })).toBeDefined(); });
});

describe("GoogleCalendarError", () => {
  it("should create with properties", () => {
    const e = new GoogleCalendarError(404, "Not Found");
    expect(e.code).toBe(404); expect(e.description).toBe("Not Found"); expect(e.name).toBe("GoogleCalendarError");
  });
});
