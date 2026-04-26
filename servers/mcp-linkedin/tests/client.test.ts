import { beforeEach, describe, expect, it, vi } from "vitest";
import { LinkedInClient, LinkedInError } from "../src/lib/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: object | string | null, status = 200) {
  const text = data === null ? "" : typeof data === "string" ? data : JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    text: () => Promise.resolve(text),
    json: () =>
      data === null
        ? Promise.reject(new Error("no body"))
        : Promise.resolve(typeof data === "string" ? JSON.parse(data) : data),
  };
}

describe("LinkedInClient", () => {
  let client: LinkedInClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new LinkedInClient({ accessToken: "test-token" });
  });

  it("should_throw_if_access_token_is_empty", () => {
    expect(() => new LinkedInClient({ accessToken: "" })).toThrow("LINKEDIN_ACCESS_TOKEN is required");
  });

  it("should_send_bearer_authorization_header", async () => {
    mockFetch.mockResolvedValue(mockResponse({ sub: "abc" }));
    await client.get("/v2/userinfo");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers.Authorization).toBe("Bearer test-token");
  });

  it("should_send_linkedin_version_header", async () => {
    mockFetch.mockResolvedValue(mockResponse({ sub: "abc" }));
    await client.get("/v2/userinfo");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers["Linkedin-Version"]).toBe("202603");
  });

  it("should_send_restli_protocol_header", async () => {
    mockFetch.mockResolvedValue(mockResponse({ sub: "abc" }));
    await client.get("/v2/userinfo");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers["X-Restli-Protocol-Version"]).toBe("2.0.0");
  });

  it("should_use_custom_api_version", async () => {
    const c = new LinkedInClient({
      accessToken: "t",
      apiVersion: "202501",
    });
    mockFetch.mockResolvedValue(mockResponse({ ok: true }));
    await c.get("/test");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers["Linkedin-Version"]).toBe("202501");
  });

  it("should_send_content_type_for_post", async () => {
    mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
    await client.post("/rest/posts", { commentary: "hello" });
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers["Content-Type"]).toBe("application/json");
  });

  it("should_send_delete_header_for_del", async () => {
    mockFetch.mockResolvedValue(mockResponse(null, 204));
    await client.del("/rest/posts/urn");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers["X-RestLi-Method"]).toBe("DELETE");
    expect(call[1].method).toBe("DELETE");
  });

  it("should_return_parsed_json_on_success", async () => {
    const expected = { sub: "abc123", name: "Jay" };
    mockFetch.mockResolvedValue(mockResponse(expected));
    const result = await client.get("/v2/userinfo");
    expect(result).toEqual(expected);
  });

  it("should_return_undefined_for_empty_body", async () => {
    mockFetch.mockResolvedValue(mockResponse(null, 204));
    const result = await client.del("/rest/posts/x");
    expect(result).toBeUndefined();
  });

  it("should_throw_LinkedInError_on_http_error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ message: "Invalid token" }),
      text: () => Promise.resolve('{"message":"Invalid token"}'),
    });
    await expect(client.get("/v2/userinfo")).rejects.toThrow(LinkedInError);
  });

  it("should_handle_non_json_http_error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: () => Promise.reject(new Error("not json")),
      text: () => Promise.resolve("Bad Gateway"),
    });
    await expect(client.get("/test")).rejects.toThrow(LinkedInError);
  });

  it("should_call_correct_url", async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }));
    await client.get("/rest/posts");
    expect(mockFetch).toHaveBeenCalledWith("https://api.linkedin.com/rest/posts", expect.anything());
  });

  it("should_send_body_as_json_string", async () => {
    mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
    await client.post("/rest/posts", { commentary: "test" });
    const call = mockFetch.mock.calls[0]!;
    const body = JSON.parse(call[1].body as string);
    expect(body.commentary).toBe("test");
  });
});

describe("LinkedInError", () => {
  it("should_have_correct_name_and_message", () => {
    const err = new LinkedInError(401, "Invalid token");
    expect(err.name).toBe("LinkedInError");
    expect(err.message).toBe("LinkedIn error 401: Invalid token");
  });

  it("should_detect_rate_limiting", () => {
    const err = new LinkedInError(429, "Too many requests");
    expect(err.isRateLimited).toBe(true);
  });

  it("should_not_flag_non_429_as_rate_limited", () => {
    const err = new LinkedInError(400, "Bad request");
    expect(err.isRateLimited).toBe(false);
  });
});
