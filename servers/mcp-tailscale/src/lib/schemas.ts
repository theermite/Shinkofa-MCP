import { z } from "zod";

// === Devices ===

export const ListDevicesSchema = z.object({
  fields: z
    .enum(["all", "default"])
    .optional()
    .describe("Field set: 'all' for every device field, 'default' for summary"),
});

export const DeviceIdSchema = z.object({
  deviceId: z.string().describe("Tailscale device ID (nodeId or legacy id)"),
});

export const AuthorizeDeviceSchema = z.object({
  deviceId: z.string().describe("Device ID to authorize"),
  authorized: z.boolean().default(true).describe("true to authorize, false to deauthorize"),
});

export const SetDeviceRoutesSchema = z.object({
  deviceId: z.string().describe("Device ID"),
  routes: z.array(z.string()).describe("List of CIDR routes to enable (e.g. ['10.0.0.0/24'])"),
});

// === Keys ===

export const ListKeysSchema = z.object({});

export const CreateAuthKeySchema = z.object({
  reusable: z.boolean().default(false).describe("Can the key be reused to enroll multiple devices"),
  ephemeral: z.boolean().default(false).describe("Enroll devices as ephemeral (auto-removed when offline)"),
  preauthorized: z.boolean().default(false).describe("Pre-authorize enrolled devices (skip admin approval)"),
  tags: z.array(z.string()).optional().describe("Tags to apply (e.g. ['tag:server']) — must exist in ACL"),
  expirySeconds: z.number().int().positive().default(86400).describe("Key validity in seconds (default 24h)"),
  description: z.string().optional().describe("Human-readable description for audit"),
});

export const KeyIdSchema = z.object({
  keyId: z.string().describe("Auth key ID to delete"),
});

// === ACL / DNS ===

export const UpdateAclSchema = z.object({
  acl: z.string().min(1).describe("Full ACL document (HuJSON or JSON string)"),
  format: z.enum(["json", "hujson"]).default("hujson").describe("ACL format; 'hujson' accepts comments"),
});

export const SetDnsNameserversSchema = z.object({
  dns: z.array(z.string()).describe("DNS server IPs for the tailnet (e.g. ['1.1.1.1'])"),
});

// === Raw ===

export const RawApiCallSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).describe("HTTP method"),
  path: z.string().describe("API path, e.g. /api/v2/tailnet/-/devices"),
  body: z.record(z.unknown()).optional().describe("Optional JSON request body"),
});
