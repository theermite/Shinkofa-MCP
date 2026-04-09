import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerInviteTools } from "../src/tools/invites.js";

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

  registerInviteTools(server, client);
});

describe("get_invite", () => {
  it("should_call_GET_invite_with_code_and_query_when_fetching", async () => {
    const handler = registeredTools.get("get_invite")!;
    await handler({ invite_code: "abc123", with_counts: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/invites/abc123", undefined, { with_counts: true });
  });

  it("should_call_GET_invite_with_empty_query_when_no_extras", async () => {
    const handler = registeredTools.get("get_invite")!;
    await handler({ invite_code: "xyz" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/invites/xyz", undefined, {});
  });
});

describe("delete_invite", () => {
  it("should_call_DELETE_invite_with_reason_when_revoking", async () => {
    const handler = registeredTools.get("delete_invite")!;
    await handler({ invite_code: "abc123", reason: "expired" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/invites/abc123", undefined, undefined, "expired");
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(404, 10006, "Unknown Invite"));
    const handler = registeredTools.get("get_invite")!;
    const result = await handler({ invite_code: "bad" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown Invite");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(5, false));
    const handler = registeredTools.get("delete_invite")!;
    const result = await handler({ invite_code: "abc" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("rate limit");
  });
});
