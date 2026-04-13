import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TailscaleClient } from "../lib/client.js";
import {
  ListDevicesSchema,
  DeviceIdSchema,
  AuthorizeDeviceSchema,
  SetDeviceRoutesSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerDeviceTools(
  server: McpServer,
  client: TailscaleClient,
) {
  server.tool(
    "list_devices",
    "List all devices in the tailnet",
    ListDevicesSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const qs = p.fields ? `?fields=${p.fields}` : "";
        const result = await client.get(client.tailnetPath(`/devices${qs}`));
        return toolResult(result);
      }),
  );

  server.tool(
    "get_device",
    "Get details about a single device",
    DeviceIdSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const result = await client.get(
          `/api/v2/device/${encodeURIComponent(p.deviceId)}`,
        );
        return toolResult(result);
      }),
  );

  server.tool(
    "delete_device",
    "Permanently remove a device from the tailnet",
    DeviceIdSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        await client.del(`/api/v2/device/${encodeURIComponent(p.deviceId)}`);
        return toolResult(undefined);
      }),
  );

  server.tool(
    "authorize_device",
    "Authorize or deauthorize a device",
    AuthorizeDeviceSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        await client.post(
          `/api/v2/device/${encodeURIComponent(p.deviceId)}/authorized`,
          { authorized: p.authorized },
        );
        return toolResult(undefined);
      }),
  );

  server.tool(
    "expire_device_key",
    "Expire a device's node key, forcing re-authentication",
    DeviceIdSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        await client.post(
          `/api/v2/device/${encodeURIComponent(p.deviceId)}/expire`,
        );
        return toolResult(undefined);
      }),
  );

  server.tool(
    "get_device_routes",
    "Get advertised and enabled subnet routes for a device",
    DeviceIdSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const result = await client.get(
          `/api/v2/device/${encodeURIComponent(p.deviceId)}/routes`,
        );
        return toolResult(result);
      }),
  );

  server.tool(
    "set_device_routes",
    "Set the enabled subnet routes for a device (overwrites all)",
    SetDeviceRoutesSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const result = await client.post(
          `/api/v2/device/${encodeURIComponent(p.deviceId)}/routes`,
          { routes: p.routes },
        );
        return toolResult(result);
      }),
  );
}
