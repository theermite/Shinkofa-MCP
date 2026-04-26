import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleCalendarClient, GoogleCalendarError } from "../src/lib/client.js";

// ── Mock helpers ──────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
    statusText: status === 404 ? "Not Found" : status === 401 ? "Unauthorized" : "OK",
  };
}

function mockEmptyResponse(status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.reject(new SyntaxError("No body")),
    headers: new Headers(),
    statusText: "No Content",
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Constructor ───────────────────────────────────────────────────────────────

describe("GoogleCalendarClient — constructor", () => {
  it("should_throw_when_accessToken_is_empty_string", () => {
    expect(() => new GoogleCalendarClient({ accessToken: "" })).toThrow("GOOGLE_ACCESS_TOKEN is required");
  });

  it("should_construct_when_valid_token_provided", () => {
    expect(new GoogleCalendarClient({ accessToken: "ya29.valid" })).toBeDefined();
  });

  it("should_construct_with_custom_baseUrl", () => {
    const client = new GoogleCalendarClient({ accessToken: "ya29.test", apiBaseUrl: "https://custom.api" });
    expect(client).toBeDefined();
  });

  it("should_construct_with_custom_timeout", () => {
    const client = new GoogleCalendarClient({ accessToken: "ya29.test", timeoutMs: 5_000 });
    expect(client).toBeDefined();
  });

  it("should_construct_with_refresh_config", () => {
    const client = new GoogleCalendarClient({
      accessToken: "ya29.test",
      refreshToken: "1//refresh",
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    expect(client).toBeDefined();
  });
});

// ── GoogleCalendarError ───────────────────────────────────────────────────────

describe("GoogleCalendarError", () => {
  it("should_create_with_code_and_description", () => {
    const e = new GoogleCalendarError(404, "Not Found");
    expect(e.code).toBe(404);
    expect(e.description).toBe("Not Found");
    expect(e.name).toBe("GoogleCalendarError");
  });

  it("should_format_message_correctly", () => {
    const e = new GoogleCalendarError(403, "Forbidden");
    expect(e.message).toBe("Google Calendar error 403: Forbidden");
  });

  it("should_be_instance_of_Error", () => {
    const e = new GoogleCalendarError(500, "Server error");
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(GoogleCalendarError);
  });
});

// ── callApi — GET ─────────────────────────────────────────────────────────────

describe("GoogleCalendarClient — callApi GET", () => {
  it("should_send_GET_with_authorization_header", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ kind: "calendar#calendarList" }));
    const client = new GoogleCalendarClient({ accessToken: "ya29.abc" });
    await client.callApi("GET", "/users/me/calendarList");
    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer ya29.abc");
    expect(options.method).toBe("GET");
  });

  it("should_use_custom_baseUrl_in_request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "primary" }));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test", apiBaseUrl: "https://custom.example.com" });
    await client.callApi("GET", "/calendars/primary");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://custom.example.com/calendars/primary");
  });

  it("should_append_query_params_to_url", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ items: [] }));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    await client.callApi("GET", "/calendars/primary/events", undefined, { singleEvents: true, maxResults: 10 });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("singleEvents=true");
    expect(url).toContain("maxResults=10");
  });

  it("should_skip_undefined_query_params", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ items: [] }));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    await client.callApi("GET", "/calendars/primary/events", undefined, { q: undefined, maxResults: 5 });
    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain("q=");
    expect(url).toContain("maxResults=5");
  });

  it("should_return_parsed_response_body", async () => {
    const payload = { kind: "calendar#event", id: "evt001" };
    mockFetch.mockResolvedValueOnce(mockResponse(payload));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    const result = await client.callApi("GET", "/calendars/primary/events/evt001");
    expect(result).toEqual(payload);
  });
});

// ── callApi — POST with body ──────────────────────────────────────────────────

describe("GoogleCalendarClient — callApi POST", () => {
  it("should_send_POST_with_json_body_and_content_type", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new-event" }, 200));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    await client.callApi("POST", "/calendars/primary/events", { summary: "Test", description: "Desc" });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(options.body as string);
    expect(body.summary).toBe("Test");
    expect(body.description).toBe("Desc");
  });

  it("should_filter_undefined_values_from_body", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "new-event" }));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    await client.callApi("POST", "/calendars/primary/events", {
      summary: "Test",
      description: undefined,
      location: null as unknown as undefined,
    });
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(Object.keys(body)).not.toContain("description");
    expect(Object.keys(body)).not.toContain("location");
    expect(body.summary).toBe("Test");
  });

  it("should_not_send_body_for_GET_requests", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ items: [] }));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    await client.callApi("GET", "/users/me/calendarList", { ignored: "field" } as Record<string, unknown>);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeUndefined();
    expect(options.headers["Content-Type"]).toBeUndefined();
  });
});

// ── callApi — 204 No Content ──────────────────────────────────────────────────

describe("GoogleCalendarClient — 204 response", () => {
  it("should_return_undefined_for_204_no_content", async () => {
    mockFetch.mockResolvedValueOnce(mockEmptyResponse(204));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    const result = await client.callApi("DELETE", "/calendars/primary/events/evt001");
    expect(result).toBeUndefined();
  });
});

// ── callApi — error responses ─────────────────────────────────────────────────

describe("GoogleCalendarClient — error responses", () => {
  it("should_throw_GoogleCalendarError_on_4xx", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 403, message: "Insufficient Permission" } }, 403));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    await expect(client.callApi("GET", "/calendars/primary")).rejects.toThrow(GoogleCalendarError);
  });

  it("should_include_error_code_and_message_from_response", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 404, message: "Event not found" } }, 404));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    await expect(client.callApi("GET", "/calendars/primary/events/bad-id")).rejects.toMatchObject({
      code: 404,
      description: "Event not found",
    });
  });

  it("should_handle_non_json_error_response_gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new SyntaxError("bad json")),
      headers: new Headers(),
    });
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    await expect(client.callApi("GET", "/calendars/primary")).rejects.toThrow(GoogleCalendarError);
  });

  it("should_use_status_code_when_error_body_has_no_code", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { message: "Something wrong" } }, 502));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test" });
    await expect(client.callApi("GET", "/calendars/primary")).rejects.toMatchObject({ code: 502 });
  });
});

// ── Token refresh ─────────────────────────────────────────────────────────────

describe("GoogleCalendarClient — token refresh", () => {
  it("should_retry_with_refreshed_token_on_401", async () => {
    // First call: 401
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Unauthorized" } }, 401));
    // Token refresh call
    mockFetch.mockResolvedValueOnce(mockResponse({ access_token: "ya29.refreshed" }));
    // Retry call: success
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "primary" }));

    const client = new GoogleCalendarClient({
      accessToken: "ya29.expired",
      refreshToken: "1//refresh-token",
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    const result = await client.callApi("GET", "/calendars/primary");
    expect(result).toEqual({ id: "primary" });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    // Token refresh must POST to OAuth endpoint
    const [refreshUrl] = mockFetch.mock.calls[1];
    expect(refreshUrl).toBe("https://oauth2.googleapis.com/token");
  });

  it("should_throw_when_refresh_fails", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Unauthorized" } }, 401));
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: "invalid_grant", error_description: "Token has been expired or revoked." }),
    );

    const client = new GoogleCalendarClient({
      accessToken: "ya29.expired",
      refreshToken: "1//bad-refresh",
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    await expect(client.callApi("GET", "/calendars/primary")).rejects.toThrow("Token refresh failed");
  });

  it("should_not_retry_on_401_without_refresh_config", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Unauthorized" } }, 401));
    const client = new GoogleCalendarClient({ accessToken: "ya29.no-refresh" });
    await expect(client.callApi("GET", "/calendars/primary")).rejects.toThrow(GoogleCalendarError);
    // Only one fetch call — no retry
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should_throw_GoogleCalendarError_when_refresh_is_called_without_credentials", async () => {
    // Manually trigger: canRefresh=false path when only partial refresh config
    const client = new GoogleCalendarClient({
      accessToken: "ya29.test",
      refreshToken: "1//token",
      // clientId and clientSecret missing — canRefresh = false
    });
    mockFetch.mockResolvedValueOnce(mockResponse({ error: { code: 401, message: "Unauthorized" } }, 401));
    await expect(client.callApi("GET", "/calendars/primary")).rejects.toThrow(GoogleCalendarError);
    // No retry fetch beyond the initial call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ── Timeout ───────────────────────────────────────────────────────────────────

describe("GoogleCalendarClient — timeout / AbortController", () => {
  it("should_pass_signal_from_AbortController_to_fetch", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: "primary" }));
    const client = new GoogleCalendarClient({ accessToken: "ya29.test", timeoutMs: 10_000 });
    await client.callApi("GET", "/calendars/primary");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.signal).toBeDefined();
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("should_propagate_AbortError_when_fetch_is_aborted", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    mockFetch.mockRejectedValueOnce(abortError);
    const client = new GoogleCalendarClient({ accessToken: "ya29.test", timeoutMs: 1 });
    await expect(client.callApi("GET", "/calendars/primary")).rejects.toMatchObject({ name: "AbortError" });
  });
});
