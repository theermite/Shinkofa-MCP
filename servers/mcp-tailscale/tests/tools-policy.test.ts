import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TailscaleClient } from "../src/lib/client.js";
import { registerPolicyTools } from "../src/tools/policy.js";

let server: McpServer;
let client: TailscaleClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let postSpy: ReturnType<typeof vi.spyOn>;
let requestSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new TailscaleClient({ apiKey: "test", tailnet: "ermite.ts.net" });
  getSpy = vi.spyOn(client, "get").mockResolvedValue({});
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  requestSpy = vi
    .spyOn(client, "request")
    .mockResolvedValue("// ACL\n{}");
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(
      args[0] as string,
      args[args.length - 1] as (...a: unknown[]) => unknown,
    );
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerPolicyTools(server, client);
});

describe("Policy tools — registration", () => {
  it("should_register_all_5_policy_tools", () => {
    for (const name of [
      "get_acl",
      "update_acl",
      "get_dns_nameservers",
      "set_dns_nameservers",
      "get_dns_preferences",
    ]) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });
});

describe("Policy tools — calls", () => {
  it("should_get_acl_via_raw_request", async () => {
    const cb = registeredTools.get("get_acl")!;
    await cb({});
    expect(requestSpy).toHaveBeenCalledWith(
      "GET",
      "/api/v2/tailnet/ermite.ts.net/acl",
      undefined,
    );
  });

  it("should_update_acl_with_hujson_content_type", async () => {
    requestSpy.mockResolvedValue({});
    const cb = registeredTools.get("update_acl")!;
    await cb({ acl: "{\"acls\":[]}", format: "hujson" });
    expect(requestSpy).toHaveBeenCalledWith(
      "POST",
      "/api/v2/tailnet/ermite.ts.net/acl",
      "{\"acls\":[]}",
      "application/hujson",
    );
  });

  it("should_update_acl_with_json_content_type", async () => {
    requestSpy.mockResolvedValue({});
    const cb = registeredTools.get("update_acl")!;
    await cb({ acl: "{\"acls\":[]}", format: "json" });
    expect(requestSpy).toHaveBeenCalledWith(
      "POST",
      "/api/v2/tailnet/ermite.ts.net/acl",
      "{\"acls\":[]}",
      "application/json",
    );
  });

  it("should_get_dns_nameservers", async () => {
    const cb = registeredTools.get("get_dns_nameservers")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith(
      "/api/v2/tailnet/ermite.ts.net/dns/nameservers",
    );
  });

  it("should_set_dns_nameservers", async () => {
    const cb = registeredTools.get("set_dns_nameservers")!;
    await cb({ dns: ["1.1.1.1", "8.8.8.8"] });
    expect(postSpy).toHaveBeenCalledWith(
      "/api/v2/tailnet/ermite.ts.net/dns/nameservers",
      { dns: ["1.1.1.1", "8.8.8.8"] },
    );
  });

  it("should_get_dns_preferences", async () => {
    const cb = registeredTools.get("get_dns_preferences")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith(
      "/api/v2/tailnet/ermite.ts.net/dns/preferences",
    );
  });
});
