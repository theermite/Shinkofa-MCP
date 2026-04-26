import { describe, expect, it } from "vitest";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";

describe("DiscordClient", () => {
  it("should throw if no token provided", () => {
    expect(() => new DiscordClient({ botToken: "" })).toThrow("DISCORD_BOT_TOKEN is required");
  });

  it("should construct with default base URL", () => {
    const client = new DiscordClient({ botToken: "test-token" });
    expect(client).toBeDefined();
  });

  it("should construct with custom base URL", () => {
    const client = new DiscordClient({
      botToken: "test-token",
      apiBaseUrl: "https://custom.api/v10",
    });
    expect(client).toBeDefined();
  });

  it("should construct with custom timeout", () => {
    const client = new DiscordClient({
      botToken: "test-token",
      timeoutMs: 5000,
    });
    expect(client).toBeDefined();
  });
});

describe("DiscordError", () => {
  it("should create with all properties", () => {
    const error = new DiscordError(400, 50035, "Invalid Form Body", {
      name: { _errors: [{ code: "BASE_TYPE_REQUIRED" }] },
    });
    expect(error.httpStatus).toBe(400);
    expect(error.code).toBe(50035);
    expect(error.description).toBe("Invalid Form Body");
    expect(error.errors).toBeDefined();
    expect(error.name).toBe("DiscordError");
    expect(error.message).toContain("400");
    expect(error.message).toContain("50035");
  });
});

describe("DiscordRateLimitError", () => {
  it("should create with retry info", () => {
    const error = new DiscordRateLimitError(1.5, false);
    expect(error.retryAfter).toBe(1.5);
    expect(error.global).toBe(false);
    expect(error.name).toBe("DiscordRateLimitError");
  });

  it("should indicate global rate limit", () => {
    const error = new DiscordRateLimitError(5, true);
    expect(error.global).toBe(true);
    expect(error.message).toContain("global");
  });
});
