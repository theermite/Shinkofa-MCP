import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TailscaleClient, TailscaleError } from "../src/lib/client.js";
import { registerDeviceTools } from "../src/tools/devices.js";

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
  postSpy = vi.spyOn(client, "post").mockResolvedValue({});
  delSpy = vi.spyOn(client, "del").mockResolvedValue(undefined);
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(
      args[0] as string,
      args[args.length - 1] as (...a: unknown[]) => unknown,
    );
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerDeviceTools(server, client);
});

describe("Device tools — registration", () => {
  it("should_register_all_7_device_tools", () => {
    const expected = [
      "list_devices",
      "get_device",
      "delete_device",
      "authorize_device",
      "expire_device_key",
      "get_device_routes",
      "set_device_routes",
    ];
    for (const name of expected) {
      expect(registeredTools.has(name)).toBe(true);
    }
  });
});

describe("Device tools — calls", () => {
  it("should_list_devices_without_fields", async () => {
    const cb = registeredTools.get("list_devices")!;
    await cb({});
    expect(getSpy).toHaveBeenCalledWith(
      "/api/v2/tailnet/ermite.ts.net/devices",
    );
  });

  it("should_list_devices_with_fields_all", async () => {
    const cb = registeredTools.get("list_devices")!;
    await cb({ fields: "all" });
    expect(getSpy).toHaveBeenCalledWith(
      "/api/v2/tailnet/ermite.ts.net/devices?fields=all",
    );
  });

  it("should_get_device", async () => {
    const cb = registeredTools.get("get_device")!;
    await cb({ deviceId: "abc123" });
    expect(getSpy).toHaveBeenCalledWith("/api/v2/device/abc123");
  });

  it("should_encode_device_id_in_url", async () => {
    const cb = registeredTools.get("get_device")!;
    await cb({ deviceId: "node:id/special" });
    expect(getSpy).toHaveBeenCalledWith(
      `/api/v2/device/${encodeURIComponent("node:id/special")}`,
    );
  });

  it("should_delete_device", async () => {
    const cb = registeredTools.get("delete_device")!;
    await cb({ deviceId: "abc" });
    expect(delSpy).toHaveBeenCalledWith("/api/v2/device/abc");
  });

  it("should_authorize_device", async () => {
    const cb = registeredTools.get("authorize_device")!;
    await cb({ deviceId: "abc", authorized: true });
    expect(postSpy).toHaveBeenCalledWith(
      "/api/v2/device/abc/authorized",
      { authorized: true },
    );
  });

  it("should_deauthorize_device", async () => {
    const cb = registeredTools.get("authorize_device")!;
    await cb({ deviceId: "abc", authorized: false });
    expect(postSpy).toHaveBeenCalledWith(
      "/api/v2/device/abc/authorized",
      { authorized: false },
    );
  });

  it("should_expire_device_key", async () => {
    const cb = registeredTools.get("expire_device_key")!;
    await cb({ deviceId: "abc" });
    expect(postSpy).toHaveBeenCalledWith("/api/v2/device/abc/expire");
  });

  it("should_get_device_routes", async () => {
    const cb = registeredTools.get("get_device_routes")!;
    await cb({ deviceId: "abc" });
    expect(getSpy).toHaveBeenCalledWith("/api/v2/device/abc/routes");
  });

  it("should_set_device_routes", async () => {
    const cb = registeredTools.get("set_device_routes")!;
    await cb({ deviceId: "abc", routes: ["10.0.0.0/24", "192.168.1.0/24"] });
    expect(postSpy).toHaveBeenCalledWith(
      "/api/v2/device/abc/routes",
      { routes: ["10.0.0.0/24", "192.168.1.0/24"] },
    );
  });
});

describe("Device tools — error handling", () => {
  it("should_handle_TailscaleError", async () => {
    getSpy.mockRejectedValue(new TailscaleError(404, "Device not found"));
    const cb = registeredTools.get("get_device")!;
    const result = (await cb({ deviceId: "bad" })) as {
      isError: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Device not found");
  });
});
