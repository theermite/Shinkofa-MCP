import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TailscaleClient, TailscaleError } from "../src/lib/client.js";
import { registerKeyTools } from "../src/tools/keys.js";

let server: McpServer;
let client: TailscaleClient;
let getSpy: ReturnType<typeof vi.spyOn>;
let postSpy: ReturnType<typeof vi.spyOn>;
let delSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: unknown[]) => unknown>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new TailscaleClient({ apiKey: "test", tailnet: "ermite.ts.net" });
  getSpy = vi.spyOn(client, "get").mockResolvedValue({});
  postSpy = vi.spyOn(client, "post").mockResolvedValue({ id: "newKeyId" });
  delSpy = vi.spyOn(client, "del").mockResolvedValue(undefined);
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as (...a: unknown[]) => unknown);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerKeyTools(server, client);
});

describe("Key tools — registration", () => {
  it("should_register_all_3_key_tools", () => {
    for (const name of ["list_keys", "create_auth_key", "delete_key"]) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });
});

describe("Key tools — calls", () => {
  it("should_list_keys", async () => {
    const cb = registeredTools.get("list_keys")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith("/api/v2/tailnet/ermite.ts.net/keys");
  });

  it("should_create_auth_key_with_defaults", async () => {
    const cb = registeredTools.get("create_auth_key")!;
    await cb({
      reusable: false,
      ephemeral: false,
      preauthorized: false,
      expirySeconds: 86400,
    });
    const call = postSpy.mock.calls[0]!;
    expect(call[0]).toBe("/api/v2/tailnet/ermite.ts.net/keys");
    const body = call[1] as Record<string, unknown>;
    expect(body).toHaveProperty("capabilities.devices.create.reusable", false);
    expect(body.expirySeconds).toBe(86400);
  });

  it("should_include_tags_when_provided", async () => {
    const cb = registeredTools.get("create_auth_key")!;
    await cb({
      reusable: true,
      ephemeral: false,
      preauthorized: true,
      tags: ["tag:server"],
      expirySeconds: 3600,
    });
    const body = postSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(body).toHaveProperty("capabilities.devices.create.tags", ["tag:server"]);
  });

  it("should_include_description_when_provided", async () => {
    const cb = registeredTools.get("create_auth_key")!;
    await cb({
      reusable: false,
      ephemeral: false,
      preauthorized: false,
      expirySeconds: 3600,
      description: "CI runner",
    });
    const body = postSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(body.description).toBe("CI runner");
  });

  it("should_omit_description_when_absent", async () => {
    const cb = registeredTools.get("create_auth_key")!;
    await cb({
      reusable: false,
      ephemeral: false,
      preauthorized: false,
      expirySeconds: 3600,
    });
    const body = postSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("description");
  });

  it("should_delete_key", async () => {
    const cb = registeredTools.get("delete_key")!;
    await cb({ keyId: "key123" });
    expect(delSpy).toHaveBeenCalledWith("/api/v2/tailnet/ermite.ts.net/keys/key123");
  });
});

describe("Key tools — error handling", () => {
  it("should_handle_TailscaleError_on_create", async () => {
    postSpy.mockRejectedValue(new TailscaleError(403, "Forbidden"));
    const cb = registeredTools.get("create_auth_key")!;
    const result = (await cb({
      reusable: false,
      ephemeral: false,
      preauthorized: false,
      expirySeconds: 3600,
    })) as { isError: boolean; content: { text: string }[] };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Forbidden");
  });
});
