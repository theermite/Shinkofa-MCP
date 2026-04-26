import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerRawTool } from "../src/tools/raw.js";

let server: McpServer;
let client: DiscordClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new DiscordClient({ botToken: "test_token" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerRawTool(server, client);
});

describe("raw_api_call", () => {
  it("should_call_GET_with_path_when_making_raw_get", async () => {
    const handler = registeredTools.get("raw_api_call")!;
    await handler({ method: "GET", path: "/gateway" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/gateway", undefined, undefined, undefined);
  });

  it("should_call_POST_with_body_when_making_raw_post", async () => {
    const handler = registeredTools.get("raw_api_call")!;
    await handler({ method: "POST", path: "/channels/ch1/messages", body: { content: "Hello" } });
    expect(callApiSpy).toHaveBeenCalledWith(
      "POST",
      "/channels/ch1/messages",
      { content: "Hello" },
      undefined,
      undefined,
    );
  });

  it("should_pass_query_params_when_provided", async () => {
    const handler = registeredTools.get("raw_api_call")!;
    await handler({ method: "GET", path: "/guilds/g1/members", query: { limit: 10 } });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/members", undefined, { limit: 10 }, undefined);
  });

  it("should_pass_reason_header_when_provided", async () => {
    const handler = registeredTools.get("raw_api_call")!;
    await handler({ method: "DELETE", path: "/channels/ch1", reason: "cleanup" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/channels/ch1", undefined, undefined, "cleanup");
  });

  it("should_pass_all_params_when_fully_specified", async () => {
    const handler = registeredTools.get("raw_api_call")!;
    await handler({
      method: "PATCH",
      path: "/guilds/g1",
      body: { name: "New" },
      query: { foo: "bar" },
      reason: "rename",
    });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/guilds/g1", { name: "New" }, { foo: "bar" }, "rename");
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(500, 0, "Internal Server Error"));
    const handler = registeredTools.get("raw_api_call")!;
    const result = await handler({ method: "GET", path: "/bad" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Discord error 500");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(120, true));
    const handler = registeredTools.get("raw_api_call")!;
    const result = await handler({ method: "GET", path: "/test" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("global");
  });

  it("should_return_timeout_error_when_request_aborted", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    callApiSpy.mockRejectedValueOnce(abortError);
    const handler = registeredTools.get("raw_api_call")!;
    const result = await handler({ method: "GET", path: "/slow" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("timed out");
  });
});
