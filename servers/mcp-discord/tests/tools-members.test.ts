import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient, DiscordError, DiscordRateLimitError } from "../src/lib/client.js";
import { registerMemberTools } from "../src/tools/members.js";

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

  registerMemberTools(server, client);
});

describe("get_member", () => {
  it("should_call_GET_members_with_user_id_when_fetching", async () => {
    const handler = registeredTools.get("get_member")!;
    await handler({ guild_id: "g1", user_id: "u1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/members/u1");
  });
});

describe("list_members", () => {
  it("should_call_GET_members_with_query_when_listing", async () => {
    const handler = registeredTools.get("list_members")!;
    await handler({ guild_id: "g1", limit: 100 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/members", undefined, { limit: 100 });
  });
});

describe("search_members", () => {
  it("should_call_GET_members_search_with_query_when_searching", async () => {
    const handler = registeredTools.get("search_members")!;
    await handler({ guild_id: "g1", query: "jay", limit: 10 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/members/search", undefined, { query: "jay", limit: 10 });
  });
});

describe("modify_member", () => {
  it("should_call_PATCH_member_with_body_and_reason_when_modifying", async () => {
    const handler = registeredTools.get("modify_member")!;
    await handler({ guild_id: "g1", user_id: "u1", nick: "NewNick", reason: "request" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/guilds/g1/members/u1", { nick: "NewNick" }, undefined, "request");
  });
});

describe("kick_member", () => {
  it("should_call_DELETE_member_with_reason_when_kicking", async () => {
    const handler = registeredTools.get("kick_member")!;
    await handler({ guild_id: "g1", user_id: "u1", reason: "rule violation" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/guilds/g1/members/u1", undefined, undefined, "rule violation");
  });
});

describe("ban_member", () => {
  it("should_call_PUT_bans_with_body_and_reason_when_banning", async () => {
    const handler = registeredTools.get("ban_member")!;
    await handler({ guild_id: "g1", user_id: "u1", delete_message_seconds: 86400, reason: "spam" });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/guilds/g1/bans/u1", { delete_message_seconds: 86400 }, undefined, "spam");
  });
});

describe("unban_member", () => {
  it("should_call_DELETE_bans_with_reason_when_unbanning", async () => {
    const handler = registeredTools.get("unban_member")!;
    await handler({ guild_id: "g1", user_id: "u1", reason: "appeal" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/guilds/g1/bans/u1", undefined, undefined, "appeal");
  });
});

describe("get_bans", () => {
  it("should_call_GET_bans_with_query_when_listing", async () => {
    const handler = registeredTools.get("get_bans")!;
    await handler({ guild_id: "g1", limit: 50 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/bans", undefined, { limit: 50 });
  });
});

describe("get_ban", () => {
  it("should_call_GET_ban_with_user_id_when_fetching", async () => {
    const handler = registeredTools.get("get_ban")!;
    await handler({ guild_id: "g1", user_id: "u1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/bans/u1");
  });
});

describe("bulk_ban", () => {
  it("should_call_POST_bulk_ban_with_body_and_reason_when_banning", async () => {
    const handler = registeredTools.get("bulk_ban")!;
    await handler({ guild_id: "g1", user_ids: ["u1", "u2"], delete_message_seconds: 3600, reason: "raid" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/guilds/g1/bulk-ban", { user_ids: ["u1", "u2"], delete_message_seconds: 3600 }, undefined, "raid");
  });
});

describe("get_roles", () => {
  it("should_call_GET_roles_when_listing", async () => {
    const handler = registeredTools.get("get_roles")!;
    await handler({ guild_id: "g1" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/guilds/g1/roles");
  });
});

describe("create_role", () => {
  it("should_call_POST_roles_with_body_and_reason_when_creating", async () => {
    const handler = registeredTools.get("create_role")!;
    await handler({ guild_id: "g1", name: "Mod", color: 0xff0000, reason: "new role" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/guilds/g1/roles", { name: "Mod", color: 0xff0000 }, undefined, "new role");
  });
});

describe("modify_role", () => {
  it("should_call_PATCH_role_with_body_and_reason_when_modifying", async () => {
    const handler = registeredTools.get("modify_role")!;
    await handler({ guild_id: "g1", role_id: "r1", name: "Admin", reason: "rename" });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/guilds/g1/roles/r1", { name: "Admin" }, undefined, "rename");
  });
});

describe("delete_role", () => {
  it("should_call_DELETE_role_with_reason_when_deleting", async () => {
    const handler = registeredTools.get("delete_role")!;
    await handler({ guild_id: "g1", role_id: "r1", reason: "unused" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/guilds/g1/roles/r1", undefined, undefined, "unused");
  });
});

describe("modify_role_positions", () => {
  it("should_call_PATCH_roles_with_positions_when_reordering", async () => {
    const handler = registeredTools.get("modify_role_positions")!;
    const roles = [{ id: "r1", position: 1 }];
    await handler({ guild_id: "g1", roles });
    expect(callApiSpy).toHaveBeenCalledWith("PATCH", "/guilds/g1/roles", { roles });
  });
});

describe("assign_role", () => {
  it("should_call_PUT_member_role_when_assigning", async () => {
    const handler = registeredTools.get("assign_role")!;
    await handler({ guild_id: "g1", user_id: "u1", role_id: "r1", reason: "promotion" });
    expect(callApiSpy).toHaveBeenCalledWith("PUT", "/guilds/g1/members/u1/roles/r1", undefined, undefined, "promotion");
  });
});

describe("remove_role", () => {
  it("should_call_DELETE_member_role_when_removing", async () => {
    const handler = registeredTools.get("remove_role")!;
    await handler({ guild_id: "g1", user_id: "u1", role_id: "r1", reason: "demotion" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/guilds/g1/members/u1/roles/r1", undefined, undefined, "demotion");
  });
});

describe("error handling", () => {
  it("should_return_error_result_when_discord_api_error", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordError(403, 50013, "Missing Permissions"));
    const handler = registeredTools.get("kick_member")!;
    const result = await handler({ guild_id: "g1", user_id: "u1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Missing Permissions");
  });

  it("should_return_rate_limit_error_when_rate_limited", async () => {
    callApiSpy.mockRejectedValueOnce(new DiscordRateLimitError(3, false));
    const handler = registeredTools.get("ban_member")!;
    const result = await handler({ guild_id: "g1", user_id: "u1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("rate limit");
  });

  it("should_return_timeout_error_when_request_aborted", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    callApiSpy.mockRejectedValueOnce(abortError);
    const handler = registeredTools.get("list_members")!;
    const result = await handler({ guild_id: "g1" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("timed out");
  });
});
