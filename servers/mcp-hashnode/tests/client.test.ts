import { beforeEach, describe, expect, it, vi } from "vitest";
import { HashnodeClient, HashnodeError } from "../src/lib/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockGqlResponse(data: object, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    json: () => Promise.resolve(data),
  };
}

describe("HashnodeClient", () => {
  let client: HashnodeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new HashnodeClient({ pat: "test-pat" });
  });

  it("should_throw_if_pat_is_empty", () => {
    expect(() => new HashnodeClient({ pat: "" })).toThrow("HASHNODE_PAT is required");
  });

  it("should_post_to_graphql_endpoint", async () => {
    mockFetch.mockResolvedValue(mockGqlResponse({ data: { me: { id: "1" } } }));
    await client.query("query { me { id } }");
    expect(mockFetch).toHaveBeenCalledWith("https://gql.hashnode.com", expect.objectContaining({ method: "POST" }));
  });

  it("should_send_authorization_header_without_bearer", async () => {
    mockFetch.mockResolvedValue(mockGqlResponse({ data: { me: { id: "1" } } }));
    await client.query("query { me { id } }");
    const call = mockFetch.mock.calls[0]!;
    expect(call[1].headers.Authorization).toBe("test-pat");
  });

  it("should_send_query_and_variables_in_body", async () => {
    mockFetch.mockResolvedValue(mockGqlResponse({ data: { publication: {} } }));
    await client.query("query($host: String!) { publication(host: $host) { id } }", {
      host: "blog.test.com",
    });
    const call = mockFetch.mock.calls[0]!;
    const body = JSON.parse(call[1].body as string);
    expect(body.query).toContain("publication");
    expect(body.variables).toEqual({ host: "blog.test.com" });
  });

  it("should_return_data_on_success", async () => {
    const expected = { me: { id: "1", username: "jay" } };
    mockFetch.mockResolvedValue(mockGqlResponse({ data: expected }));
    const result = await client.query("query { me { id username } }");
    expect(result).toEqual(expected);
  });

  it("should_throw_HashnodeError_on_graphql_errors", async () => {
    mockFetch.mockResolvedValue(
      mockGqlResponse({
        errors: [{ message: "Not found" }],
      }),
    );
    await expect(client.query('query { publication(host: "nope") { id } }')).rejects.toThrow(HashnodeError);
  });

  it("should_parse_graphql_error_message", async () => {
    mockFetch.mockResolvedValue(
      mockGqlResponse({
        errors: [{ message: "Validation failed" }],
      }),
    );
    try {
      await client.query("mutation { bad }");
    } catch (e) {
      const err = e as HashnodeError;
      expect(err.status).toBe(400);
      expect(err.detail).toBe("Validation failed");
    }
  });

  it("should_throw_HashnodeError_on_http_error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ message: "Invalid token" }),
    });
    await expect(client.query("query { me { id } }")).rejects.toThrow(HashnodeError);
  });

  it("should_handle_non_json_http_error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: () => Promise.reject(new Error("not json")),
    });
    await expect(client.query("query { me { id } }")).rejects.toThrow(HashnodeError);
  });

  it("should_use_custom_endpoint", async () => {
    const c = new HashnodeClient({
      pat: "p",
      endpoint: "https://custom.gql.com",
    });
    mockFetch.mockResolvedValue(mockGqlResponse({ data: {} }));
    await c.query("query { me { id } }");
    expect(mockFetch).toHaveBeenCalledWith("https://custom.gql.com", expect.anything());
  });
});

describe("HashnodeError", () => {
  it("should_have_correct_name_and_message", () => {
    const err = new HashnodeError(400, "bad query");
    expect(err.name).toBe("HashnodeError");
    expect(err.message).toBe("Hashnode error 400: bad query");
  });
});
