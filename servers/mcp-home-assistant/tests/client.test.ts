import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HAClient, HAError } from "../src/lib/client.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(data: unknown, status = 200, contentType = "application/json") {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === "string" ? data : JSON.stringify(data)),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    headers: new Headers({ "content-type": contentType }),
  };
}

function makeClient(opts?: { timeoutMs?: number }) {
  return new HAClient({
    accessToken: "test-token",
    baseUrl: "http://ha:8123",
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// HAError
// ---------------------------------------------------------------------------

describe("HAError", () => {
  it("should_store_status_when_constructed", () => {
    const err = new HAError(404, "Not found");
    expect(err.status).toBe(404);
  });

  it("should_store_description_when_constructed", () => {
    const err = new HAError(500, "Internal error");
    expect(err.description).toBe("Internal error");
  });

  it("should_set_name_to_HAError_when_constructed", () => {
    const err = new HAError(401, "Unauthorized");
    expect(err.name).toBe("HAError");
  });

  it("should_be_instanceof_Error_when_constructed", () => {
    expect(new HAError(400, "Bad")).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// HAClient — constructor
// ---------------------------------------------------------------------------

describe("HAClient — constructor", () => {
  it("should_throw_when_accessToken_is_missing", () => {
    expect(() => new HAClient({ accessToken: "", baseUrl: "http://ha:8123" })).toThrow("HA_ACCESS_TOKEN is required");
  });

  it("should_throw_when_baseUrl_is_missing", () => {
    expect(() => new HAClient({ accessToken: "tok", baseUrl: "" })).toThrow("HA_BASE_URL is required");
  });

  it("should_construct_when_config_is_valid", () => {
    expect(makeClient()).toBeDefined();
  });

  it("should_strip_trailing_slash_from_baseUrl_when_present", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }));
    const client = new HAClient({
      accessToken: "tok",
      baseUrl: "http://ha:8123/",
    });
    await client.callApi("GET", "/states");
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe("http://ha:8123/api/states");
    expect(calledUrl).not.toContain("//api");
  });
});

// ---------------------------------------------------------------------------
// HAClient — callApi
// ---------------------------------------------------------------------------

describe("HAClient — callApi", () => {
  beforeEach(() => mockFetch.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("should_send_bearer_auth_header_when_making_GET_request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ entity_id: "light.x" }));
    const client = makeClient();
    await client.callApi("GET", "/states/light.x");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  });

  it("should_build_correct_url_when_calling_GET", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]));
    await makeClient().callApi("GET", "/states");
    expect(mockFetch.mock.calls[0][0]).toBe("http://ha:8123/api/states");
  });

  it("should_send_json_body_when_method_is_POST", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ status: "ok" }));
    await makeClient().callApi("POST", "/services/light/turn_on", {
      entity_id: "light.x",
    });
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(JSON.stringify({ entity_id: "light.x" }));
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("should_return_undefined_when_response_status_is_204", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null, 204));
    const result = await makeClient().callApi("POST", "/services/light/turn_on");
    expect(result).toBeUndefined();
  });

  it("should_throw_HAError_when_response_is_not_ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: "Entity not found" }, 404));
    await expect(makeClient().callApi("GET", "/states/fake.entity")).rejects.toBeInstanceOf(HAError);
  });

  it("should_include_status_in_HAError_when_request_fails", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: "Not found" }, 404));
    const err = await makeClient()
      .callApi("GET", "/states/fake.entity")
      .catch((e) => e);
    expect(err.status).toBe(404);
  });

  it("should_return_text_when_content_type_is_not_json", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse("plain text log", 200, "text/plain"));
    const result = await makeClient().callApi("GET", "/error_log");
    expect(result).toBe("plain text log");
  });

  it("should_append_query_params_when_query_object_provided", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]));
    await makeClient().callApi("GET", "/history/period", undefined, {
      filter_entity_id: "light.x",
      minimal_response: true,
    });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("filter_entity_id=light.x");
    expect(url).toContain("minimal_response=true");
  });

  it("should_skip_undefined_query_values_when_building_url", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]));
    await makeClient().callApi("GET", "/history/period", undefined, {
      filter_entity_id: undefined,
      end_time: "2026-04-08T12:00:00Z",
    });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain("filter_entity_id");
    expect(url).toContain("end_time=2026-04-08T12%3A00%3A00Z");
  });

  it("should_not_send_body_when_method_is_GET", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}));
    await makeClient().callApi("GET", "/config");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.body).toBeUndefined();
  });

  it("should_throw_HAError_with_text_body_when_error_response_is_plain_text", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse("Unauthorized", 401, "text/plain"));
    const err = await makeClient()
      .callApi("GET", "/states")
      .catch((e) => e);
    expect(err).toBeInstanceOf(HAError);
    expect(err.description).toBe("Unauthorized");
  });
});

// ---------------------------------------------------------------------------
// HAClient — callApiRaw
// ---------------------------------------------------------------------------

describe("HAClient — callApiRaw", () => {
  beforeEach(() => mockFetch.mockReset());

  it("should_return_base64_and_mimeType_when_request_succeeds", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null, 200, "image/jpeg"));
    const result = await makeClient().callApiRaw("/camera_proxy/camera.front");
    expect(result).toHaveProperty("base64");
    expect(result).toHaveProperty("mimeType", "image/jpeg");
  });

  it("should_use_image_jpeg_fallback_when_content_type_is_missing", async () => {
    const resp = {
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      headers: new Headers(), // no content-type
    };
    mockFetch.mockResolvedValueOnce(resp);
    const result = await makeClient().callApiRaw("/camera_proxy/camera.front");
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("should_throw_HAError_when_response_is_not_ok", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null, 403, "image/jpeg"));
    await expect(makeClient().callApiRaw("/camera_proxy/camera.private")).rejects.toBeInstanceOf(HAError);
  });

  it("should_send_bearer_auth_header_when_making_raw_request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null, 200, "image/jpeg"));
    await makeClient().callApiRaw("/camera_proxy/camera.front");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  });
});

// ---------------------------------------------------------------------------
// HAClient — timeout via AbortController
// ---------------------------------------------------------------------------

describe("HAClient — timeout", () => {
  beforeEach(() => mockFetch.mockReset());

  it("should_abort_request_when_timeout_is_exceeded", async () => {
    mockFetch.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          // Simulate abort signal firing immediately
          const signal = init.signal as AbortSignal;
          if (signal) {
            signal.addEventListener("abort", () => {
              const err = new Error("The operation was aborted");
              err.name = "AbortError";
              reject(err);
            });
          }
        }),
    );

    const client = new HAClient({
      accessToken: "tok",
      baseUrl: "http://ha:8123",
      timeoutMs: 1,
    });

    await expect(client.callApi("GET", "/states")).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
