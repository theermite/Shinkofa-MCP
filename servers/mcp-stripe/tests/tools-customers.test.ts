import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient, StripeError } from "../src/lib/client.js";
import { registerCustomerTools } from "../src/tools/customers.js";

let server: McpServer;
let client: StripeClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new StripeClient({ secretKey: "sk_test_123" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    const name = args[0] as string;
    const cb = args[args.length - 1] as (...a: unknown[]) => unknown;
    registeredTools.set(name, cb);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerCustomerTools(server, client);
});

describe("Customer tools — callbacks", () => {
  it("should_call_POST_customers_when_create", async () => {
    callApiSpy.mockResolvedValue({ id: "cus_new" });
    const cb = registeredTools.get("create_customer")!;
    const result = await cb({ email: "jay@shinkofa.com" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/customers", {
      email: "jay@shinkofa.com",
    });
    expect(result.content[0].text).toContain("cus_new");
  });

  it("should_call_GET_with_encoded_id_when_get", async () => {
    callApiSpy.mockResolvedValue({ id: "cus_123" });
    const cb = registeredTools.get("get_customer")!;
    await cb({ customer_id: "cus_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/customers/cus_123",
      undefined,
    );
  });

  it("should_encode_special_chars_in_customer_id", async () => {
    const cb = registeredTools.get("get_customer")!;
    await cb({ customer_id: "cus/special&id" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      `/customers/${encodeURIComponent("cus/special&id")}`,
      undefined,
    );
  });

  it("should_pass_expand_when_provided", async () => {
    const cb = registeredTools.get("get_customer")!;
    await cb({
      customer_id: "cus_123",
      expand: ["default_source"],
    });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/customers/cus_123",
      { expand: ["default_source"] },
    );
  });

  it("should_split_customer_id_from_update_params", async () => {
    const cb = registeredTools.get("update_customer")!;
    await cb({ customer_id: "cus_123", name: "Jay Updated" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/customers/cus_123",
      { name: "Jay Updated" },
    );
  });

  it("should_call_DELETE_when_delete_customer", async () => {
    callApiSpy.mockResolvedValue({ id: "cus_123", deleted: true });
    const cb = registeredTools.get("delete_customer")!;
    await cb({ customer_id: "cus_123" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "DELETE",
      "/customers/cus_123",
    );
  });

  it("should_call_search_endpoint", async () => {
    const cb = registeredTools.get("search_customers")!;
    await cb({ query: "email:'jay@shinkofa.com'" });
    expect(callApiSpy).toHaveBeenCalledWith(
      "GET",
      "/customers/search",
      { query: "email:'jay@shinkofa.com'" },
    );
  });

  it("should_return_toolError_when_StripeError", async () => {
    callApiSpy.mockRejectedValue(
      new StripeError(
        404,
        "invalid_request_error",
        "resource_missing",
        "No such customer",
      ),
    );
    const cb = registeredTools.get("get_customer")!;
    const result = await cb({ customer_id: "cus_xxx" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });

  it("should_return_toolError_when_timeout", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    callApiSpy.mockRejectedValue(err);
    const cb = registeredTools.get("list_customers")!;
    const result = await cb({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Request timed out");
  });

  it("should_return_toolError_when_network_error", async () => {
    callApiSpy.mockRejectedValue(new TypeError("fetch failed"));
    const cb = registeredTools.get("list_customers")!;
    const result = await cb({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });
});
