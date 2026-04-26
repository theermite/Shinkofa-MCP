import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StripeClient } from "../src/lib/client.js";
import { registerPromotionTools } from "../src/tools/promotions.js";

let server: McpServer;
let client: StripeClient;
let callApiSpy: ReturnType<typeof vi.spyOn>;
let registeredTools: Map<string, (...args: any[]) => any>;

beforeEach(() => {
  server = new McpServer({ name: "test", version: "1.0.0" });
  client = new StripeClient({ secretKey: "sk_test_123" });
  callApiSpy = vi.spyOn(client, "callApi").mockResolvedValue({});
  registeredTools = new Map();

  const origTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    registeredTools.set(args[0] as string, args[args.length - 1] as any);
    return origTool(...(args as Parameters<typeof origTool>));
  }) as typeof server.tool;

  registerPromotionTools(server, client);
});

describe("Promotion tools — coupons", () => {
  it("should_create_coupon", async () => {
    const cb = registeredTools.get("create_coupon")!;
    await cb({ percent_off: 20, duration: "once" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/coupons", {
      percent_off: 20,
      duration: "once",
    });
  });

  it("should_get_coupon_with_encoded_id", async () => {
    const cb = registeredTools.get("get_coupon")!;
    await cb({ coupon_id: "SHINKOFA20" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/coupons/SHINKOFA20");
  });

  it("should_delete_coupon", async () => {
    const cb = registeredTools.get("delete_coupon")!;
    await cb({ coupon_id: "SHINKOFA20" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/coupons/SHINKOFA20");
  });

  it("should_list_coupons", async () => {
    const cb = registeredTools.get("list_coupons")!;
    await cb({ limit: 5 });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/coupons", {
      limit: 5,
    });
  });
});

describe("Promotion tools — promo codes", () => {
  it("should_create_promo_code", async () => {
    const cb = registeredTools.get("create_promo_code")!;
    await cb({ coupon: "coupon_123", code: "WELCOME" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/promotion_codes", { coupon: "coupon_123", code: "WELCOME" });
  });

  it("should_get_promo_code", async () => {
    const cb = registeredTools.get("get_promo_code")!;
    await cb({ promo_code_id: "promo_123" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/promotion_codes/promo_123");
  });

  it("should_update_promo_code", async () => {
    const cb = registeredTools.get("update_promo_code")!;
    await cb({ promo_code_id: "promo_123", active: false });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/promotion_codes/promo_123", { active: false });
  });

  it("should_list_promo_codes_by_coupon", async () => {
    const cb = registeredTools.get("list_promo_codes")!;
    await cb({ coupon: "coupon_123", active: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/promotion_codes", { coupon: "coupon_123", active: true });
  });
});
