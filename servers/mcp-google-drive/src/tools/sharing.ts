import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DriveClient } from "../lib/client.js";
import { DeletePermissionSchema, ListPermissionsSchema, ShareFileSchema } from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerSharingTools(server: McpServer, client: DriveClient): void {
  server.tool("drive_share_file", "Share a file or folder (add a permission)", ShareFileSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const body: Record<string, unknown> = { role: p.role, type: p.type };
      if (p.emailAddress) body.emailAddress = p.emailAddress;
      if (p.domain) body.domain = p.domain;
      const query: Record<string, string | number | boolean | undefined> = {};
      if (p.sendNotificationEmail !== undefined) query.sendNotificationEmail = p.sendNotificationEmail;
      return toolResult(
        await client.callApi("POST", `/files/${encodeURIComponent(p.fileId)}/permissions`, body, query),
      );
    });
  });

  server.tool("drive_list_permissions", "List who has access to a file", ListPermissionsSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (p.fields) query.fields = p.fields;
      else query.fields = "permissions(id,type,role,emailAddress,displayName,domain)";
      return toolResult(
        await client.callApi("GET", `/files/${encodeURIComponent(p.fileId)}/permissions`, undefined, query),
      );
    });
  });

  server.tool("drive_remove_permission", "Remove a permission (unshare)", DeletePermissionSchema.shape, async (p) => {
    return withErrorHandler(async () => {
      return toolResult(
        await client.callApi(
          "DELETE",
          `/files/${encodeURIComponent(p.fileId)}/permissions/${encodeURIComponent(p.permissionId)}`,
        ),
      );
    });
  });
}
