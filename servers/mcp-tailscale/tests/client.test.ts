import { describe, it, expect, vi, beforeEach } from "vitest";
import { TailscaleClient, TailscaleError } from "../src/lib/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: object | string | null, status = 200) {
  const text =
    data === null ? "" : typeof data === "string" ? data : JSON.stringify(data);
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

describe("TailscaleClient", () => {
  let client: TailscaleClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TailscaleClient({ apiKey: "tskey-api-test" });
  });

  it("should_throw_if_api_key_is_empty", () => {
    expect(() => new TailscaleClient({ apiKey: "" })).toThrow(
      "TAILSCALE_API_KEY is required",
    );
  });

  it("should_default_tailnet_to_dash", () => {
    expect(client.tailnet).toBe("-");
  });

  it("should_use_custom_tailnet", () => {
    const c = new TailscaleClient({
      apiKey: "k",
      tailnet: "ermite.ts.net",
    });
    expect(c.tailnet).toBe("ermite.ts.net");
  });

  it("should_send_bearer_authorization_header", async () => {
    mockFetch.mockResolvedValue(mockResponse({ devices: [] }));
    await client.get("/api/v2/tailnet/-/devices");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers.Authorization).toBe("Bearer tskey-api-test");
  });

  it("should_call_correct_url", async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }));
    await client.get("/api/v2/tailnet/-/devices");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.tailscale.com/api/v2/tailnet/-/devices",
      expect.anything(),
    );
  });

  it("should_send_content_type_json_for_post_object", async () => {
    mockFetch.mockResolvedValue(mockResponse({ id: "k1" }));
    await client.post("/api/v2/tailnet/-/keys", { capabilities: {} });
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers["Content-Type"]).toBe("application/json");
  });

  it("should_send_raw_text_for_string_body", async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }));
    await client.request("POST", "/api/v2/tailnet/-/acl", "{\"acls\":[]}", "application/hujson");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers["Content-Type"]).toBe("application/hujson");
    expect(call[1].body).toBe("{\"acls\":[]}");
  });

  it("should_send_body_as_json_string", async () => {
    mockFetch.mockResolvedValue(mockResponse({ id: "k1" }));
    await client.post("/api/v2/tailnet/-/keys", { reusable: true });
    const call = mockFetch.mock.calls[0]!;
    const body = JSON.parse(call[1].body as string);
    expect(body.reusable).toBe(true);
  });

  it("should_return_parsed_json_on_success", async () => {
    const expected = { devices: [{ id: "d1" }] };
    mockFetch.mockResolvedValue(mockResponse(expected));
    const result = await client.get("/api/v2/tailnet/-/devices");
    expect(result).toEqual(expected);
  });

  it("should_return_undefined_for_empty_body", async () => {
    mockFetch.mockResolvedValue(mockResponse(null, 204));
    const result = await client.del("/api/v2/device/d1");
    expect(result).toBeUndefined();
  });

  it("should_return_text_for_non_json_response", async () => {
    mockFetch.mockResolvedValue(mockResponse("// HuJSON ACL\n{\"acls\":[]}"));
    const result = await client.get("/api/v2/tailnet/-/acl");
    expect(typeof result).toBe("string");
  });

  it("should_throw_TailscaleError_on_http_error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ message: "Invalid API key" }),
      text: () => Promise.resolve('{"message":"Invalid API key"}'),
    });
    await expect(client.get("/api/v2/tailnet/-/devices")).rejects.toThrow(
      TailscaleError,
    );
  });

  it("should_handle_non_json_http_error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: () => Promise.reject(new Error("not json")),
      text: () => Promise.resolve("Bad Gateway"),
    });
    await expect(client.get("/test")).rejects.toThrow(TailscaleError);
  });

  it("should_build_tailnet_path", () => {
    expect(client.tailnetPath("/devices")).toBe("/api/v2/tailnet/-/devices");
  });

  it("should_encode_tailnet_in_path", () => {
    const c = new TailscaleClient({
      apiKey: "k",
      tailnet: "ermite.ts.net",
    });
    expect(c.tailnetPath("/devices")).toBe(
      "/api/v2/tailnet/ermite.ts.net/devices",
    );
  });
});

describe("TailscaleError", () => {
  it("should_have_correct_name_and_message", () => {
    const err = new TailscaleError(401, "Invalid API key");
    expect(err.name).toBe("TailscaleError");
    expect(err.message).toBe("Tailscale error 401: Invalid API key");
  });

  it("should_detect_rate_limiting", () => {
    const err = new TailscaleError(429, "Too many requests");
    expect(err.isRateLimited).toBe(true);
  });

  it("should_detect_unauthorized_on_401", () => {
    expect(new TailscaleError(401, "x").isUnauthorized).toBe(true);
  });

  it("should_detect_unauthorized_on_403", () => {
    expect(new TailscaleError(403, "x").isUnauthorized).toBe(true);
  });

  it("should_not_flag_non_auth_as_unauthorized", () => {
    expect(new TailscaleError(400, "x").isUnauthorized).toBe(false);
  });
});
