import { describe, expect, it } from "vitest";
import {
  AuthorizeDeviceSchema,
  CreateAuthKeySchema,
  DeviceIdSchema,
  KeyIdSchema,
  ListDevicesSchema,
  RawApiCallSchema,
  SetDeviceRoutesSchema,
  SetDnsNameserversSchema,
  UpdateAclSchema,
} from "../src/lib/schemas.js";

describe("ListDevicesSchema", () => {
  it("should_accept_empty", () => {
    expect(ListDevicesSchema.safeParse({}).success).toBe(true);
  });
  it("should_accept_fields_all", () => {
    expect(ListDevicesSchema.safeParse({ fields: "all" }).success).toBe(true);
  });
  it("should_reject_unknown_fields_value", () => {
    expect(ListDevicesSchema.safeParse({ fields: "bogus" }).success).toBe(false);
  });
});

describe("DeviceIdSchema", () => {
  it("should_require_device_id", () => {
    expect(DeviceIdSchema.safeParse({}).success).toBe(false);
  });
  it("should_accept_valid_device_id", () => {
    expect(DeviceIdSchema.safeParse({ deviceId: "abc" }).success).toBe(true);
  });
});

describe("AuthorizeDeviceSchema", () => {
  it("should_default_authorized_to_true", () => {
    const r = AuthorizeDeviceSchema.parse({ deviceId: "d1" });
    expect(r.authorized).toBe(true);
  });
  it("should_accept_explicit_false", () => {
    expect(AuthorizeDeviceSchema.parse({ deviceId: "d1", authorized: false }).authorized).toBe(false);
  });
});

describe("SetDeviceRoutesSchema", () => {
  it("should_require_routes_array", () => {
    expect(SetDeviceRoutesSchema.safeParse({ deviceId: "d1" }).success).toBe(false);
  });
  it("should_accept_routes", () => {
    expect(
      SetDeviceRoutesSchema.safeParse({
        deviceId: "d1",
        routes: ["10.0.0.0/24"],
      }).success,
    ).toBe(true);
  });
});

describe("CreateAuthKeySchema", () => {
  it("should_apply_defaults", () => {
    const r = CreateAuthKeySchema.parse({});
    expect(r.reusable).toBe(false);
    expect(r.ephemeral).toBe(false);
    expect(r.preauthorized).toBe(false);
    expect(r.expirySeconds).toBe(86400);
  });
  it("should_accept_tags", () => {
    expect(CreateAuthKeySchema.parse({ tags: ["tag:server"] }).tags).toEqual(["tag:server"]);
  });
  it("should_reject_negative_expiry", () => {
    expect(CreateAuthKeySchema.safeParse({ expirySeconds: -1 }).success).toBe(false);
  });
});

describe("KeyIdSchema", () => {
  it("should_require_key_id", () => {
    expect(KeyIdSchema.safeParse({}).success).toBe(false);
  });
});

describe("UpdateAclSchema", () => {
  it("should_default_format_to_hujson", () => {
    const r = UpdateAclSchema.parse({ acl: "{}" });
    expect(r.format).toBe("hujson");
  });
  it("should_reject_empty_acl", () => {
    expect(UpdateAclSchema.safeParse({ acl: "" }).success).toBe(false);
  });
});

describe("SetDnsNameserversSchema", () => {
  it("should_accept_dns_array", () => {
    expect(SetDnsNameserversSchema.safeParse({ dns: ["1.1.1.1"] }).success).toBe(true);
  });
  it("should_require_dns_field", () => {
    expect(SetDnsNameserversSchema.safeParse({}).success).toBe(false);
  });
});

describe("RawApiCallSchema", () => {
  it("should_accept_valid_call", () => {
    expect(
      RawApiCallSchema.safeParse({
        method: "GET",
        path: "/api/v2/tailnet/-/devices",
      }).success,
    ).toBe(true);
  });
  it("should_reject_unknown_method", () => {
    expect(RawApiCallSchema.safeParse({ method: "OPTIONS", path: "/x" }).success).toBe(false);
  });
});
