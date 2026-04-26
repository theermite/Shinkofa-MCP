import { beforeEach, describe, expect, it, vi } from "vitest";
import { GmailClient, GmailError } from "../src/lib/client.js";

// ── Fetch mock ────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 204 ? "No Content" : status >= 400 ? "Error" : "OK",
    json: () => Promise.resolve(data),
    headers: new Headers(),
  } as unknown as Response;
}

function mockResponseNoJson(status: number, statusText = "Error"): Response {
  return {
    ok: false,
    status,
    statusText,
    json: () => Promise.reject(new SyntaxError("Unexpected token")),
    headers: new Headers(),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ── GmailError ────────────────────────────────────────────────────────────────

describe("GmailError", () => {
  it("should have code and description", () => {
    const err = new GmailError(403, "Forbidden");
    expect(err.code).toBe(403);
    expect(err.description).toBe("Forbidden");
  });

  it("should be instanceof Error", () => {
    const err = new GmailError(500, "Server Error");
    expect(err).toBeInstanceOf(Error);
  });

  it("should include code and description in message", () => {
    const err = new GmailError(404, "Not Found");
    expect(err.message).toContain("404");
    expect(err.message).toContain("Not Found");
  });

  it("should have name GmailError", () => {
    const err = new GmailError(401, "Unauthorized");
    expect(err.name).toBe("GmailError");
  });
});

// ── GmailClient constructor ───────────────────────────────────────────────────

describe("GmailClient — constructor", () => {
  it("should throw if accessToken is empty string", () => {
    expect(() => new GmailClient({ accessToken: "" })).toThrow("GOOGLE_ACCESS_TOKEN is required");
  });

  it("should construct with a valid access token", () => {
    const client = new GmailClient({ accessToken: "ya29.test-token" });
    expect(client).toBeInstanceOf(GmailClient);
  });

  it("should use default baseUrl when apiBaseUrl is not provided", async () => {
    const client = new GmailClient({ accessToken: "ya29.test" });
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "msg1" }));
    await client.callApi("GET", "/users/me/messages/msg1");
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("gmail.googleapis.com/gmail/v1");
  });

  it("should use custom apiBaseUrl when provided", async () => {
    const client = new GmailClient({ accessToken: "ya29.test", apiBaseUrl: "https://custom.api/v2" });
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "msg1" }));
    await client.callApi("GET", "/users/me/messages/msg1");
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("https://custom.api/v2");
  });
});

// ── callApi — request building ────────────────────────────────────────────────

describe("GmailClient — callApi request building", () => {
  it("should make GET request with Authorization header", async () => {
    const client = new GmailClient({ accessToken: "ya29.access" });
    mockFetch.mockResolvedValueOnce(mockResponse({ messages: [] }));

    await client.callApi("GET", "/users/me/messages");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer ya29.access");
    expect(init.method).toBe("GET");
  });

  it("should make POST request with JSON body and Content-Type header", async () => {
    const client = new GmailClient({ accessToken: "ya29.access" });
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "msg1" }));

    await client.callApi("POST", "/users/me/messages/send", { raw: "base64data" });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ raw: "base64data" }));
  });

  it("should handle 204 empty response and return undefined", async () => {
    const client = new GmailClient({ accessToken: "ya29.access" });
    mockFetch.mockResolvedValueOnce(mockResponse(undefined, 204));

    const result = await client.callApi("DELETE", "/users/me/messages/msg1");
    expect(result).toBeUndefined();
  });

  it("should throw GmailError on 4xx response with error body", async () => {
    const client = new GmailClient({ accessToken: "ya29.access" });
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 403, message: "Forbidden" } }, 403));

    await expect(client.callApi("GET", "/users/me/messages")).rejects.toThrow(GmailError);
  });

  it("should use error code from response body when available", async () => {
    const client = new GmailClient({ accessToken: "ya29.access" });
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 429, message: "Rate limit exceeded" } }, 429));

    await expect(client.callApi("GET", "/users/me/messages")).rejects.toMatchObject({
      code: 429,
      description: "Rate limit exceeded",
    });
  });

  it("should fall back to response.status when error body has no code", async () => {
    const client = new GmailClient({ accessToken: "ya29.access" });
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { message: "Something went wrong" } }, 500));

    await expect(client.callApi("GET", "/users/me/messages")).rejects.toMatchObject({
      code: 500,
    });
  });

  it("should handle non-JSON error response gracefully", async () => {
    const client = new GmailClient({ accessToken: "ya29.access" });
    mockFetch.mockResolvedValueOnce(mockResponseNoJson(503, "Service Unavailable"));

    await expect(client.callApi("GET", "/users/me/messages")).rejects.toThrow(GmailError);
  });
});

// ── callApi — query string ────────────────────────────────────────────────────

describe("GmailClient — query string building", () => {
  it("should append query params to the URL", async () => {
    const client = new GmailClient({ accessToken: "ya29.test" });
    mockFetch.mockResolvedValueOnce(mockResponse({ messages: [] }));

    await client.callApi("GET", "/users/me/messages", undefined, { maxResults: 10, q: "is:unread" });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("maxResults=10");
    expect(url).toContain("q=is%3Aunread");
  });

  it("should skip undefined and null query params", async () => {
    const client = new GmailClient({ accessToken: "ya29.test" });
    mockFetch.mockResolvedValueOnce(mockResponse({ messages: [] }));

    await client.callApi("GET", "/users/me/messages", undefined, {
      maxResults: undefined,
      pageToken: undefined,
      q: "from:test@example.com",
    });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain("maxResults");
    expect(url).not.toContain("pageToken");
    expect(url).toContain("q=");
  });

  it("should expand array query params with repeated keys", async () => {
    const client = new GmailClient({ accessToken: "ya29.test" });
    mockFetch.mockResolvedValueOnce(mockResponse({ messages: [] }));

    // cast to any to pass array — matches internal handling
    await client.callApi("GET", "/users/me/messages", undefined, {
      labelIds: ["INBOX", "UNREAD"] as unknown as string,
    });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    // URLSearchParams encodes repeated keys
    expect(url).toContain("labelIds=INBOX");
    expect(url).toContain("labelIds=UNREAD");
  });

  it("should not add ? when no query params are provided", async () => {
    const client = new GmailClient({ accessToken: "ya29.test" });
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "msg1" }));

    await client.callApi("GET", "/users/me/messages/msg1");

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain("?");
  });
});

// ── Token refresh ─────────────────────────────────────────────────────────────

describe("GmailClient — token refresh", () => {
  it("should retry on 401 when refresh config is present", async () => {
    const client = new GmailClient({
      accessToken: "ya29.expired",
      refreshToken: "1//refresh",
      clientId: "client-id",
      clientSecret: "client-secret",
    });

    // First call returns 401 (expired token)
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Invalid Credentials" } }, 401));
    // Token refresh returns new token
    mockFetch.mockResolvedValueOnce(mockResponse({ access_token: "ya29.new-token" }));
    // Retry returns success
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "msg1", snippet: "Hello" }));

    const result = await client.callApi("GET", "/users/me/messages/msg1");
    expect(result).toEqual({ id: "msg1", snippet: "Hello" });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should use the new token for the retry request", async () => {
    const client = new GmailClient({
      accessToken: "ya29.expired",
      refreshToken: "1//refresh",
      clientId: "client-id",
      clientSecret: "client-secret",
    });

    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Invalid Credentials" } }, 401));
    mockFetch.mockResolvedValueOnce(mockResponse({ access_token: "ya29.fresh" }));
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "msg1" }));

    await client.callApi("GET", "/users/me/messages/msg1");

    // Third call (retry) should use the new token
    const [, retryInit] = mockFetch.mock.calls[2] as [string, RequestInit];
    expect((retryInit.headers as Record<string, string>).Authorization).toBe("Bearer ya29.fresh");
  });

  it("should not retry on 401 when no refresh config is present", async () => {
    const client = new GmailClient({ accessToken: "ya29.expired" });

    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Invalid Credentials" } }, 401));

    await expect(client.callApi("GET", "/users/me/messages")).rejects.toThrow(GmailError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should throw GmailError when token refresh fails", async () => {
    const client = new GmailClient({
      accessToken: "ya29.expired",
      refreshToken: "1//bad-refresh",
      clientId: "client-id",
      clientSecret: "client-secret",
    });

    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Invalid Credentials" } }, 401));
    // Refresh endpoint returns error
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "invalid_grant", error_description: "Token has been revoked" }, 400),
    );

    await expect(client.callApi("GET", "/users/me/messages")).rejects.toMatchObject({
      code: 401,
      description: expect.stringContaining("Token has been revoked"),
    });
  });

  it("should throw if refresh config is partially missing", async () => {
    // Only refreshToken, no clientId/clientSecret → canRefresh is false
    const client = new GmailClient({
      accessToken: "ya29.expired",
      refreshToken: "1//refresh",
      // clientId and clientSecret omitted
    });

    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Invalid Credentials" } }, 401));

    await expect(client.callApi("GET", "/users/me/messages")).rejects.toThrow(GmailError);
    // Only 1 fetch call — no refresh attempted
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ── Timeout ───────────────────────────────────────────────────────────────────

describe("GmailClient — timeout", () => {
  it("should abort request on timeout via AbortController", async () => {
    const client = new GmailClient({ accessToken: "ya29.test", timeoutMs: 1 });

    // Simulate fetch that resolves after timeout fires
    mockFetch.mockImplementationOnce((_url: string, init: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        // Listen for abort signal
        (init.signal as AbortSignal).addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    await expect(client.callApi("GET", "/users/me/messages")).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
