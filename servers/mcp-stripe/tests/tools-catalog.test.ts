import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StripeClient } from "../src/lib/client.js";
import { registerCatalogTools } from "../src/tools/catalog.js";

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

  registerCatalogTools(server, client);
});

describe("Catalog tools — products", () => {
  it("should_create_product", async () => {
    const cb = registeredTools.get("create_product")!;
    await cb({ name: "Coaching Sensei" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/products", {
      name: "Coaching Sensei",
    });
  });

  it("should_update_product_with_encoded_id", async () => {
    const cb = registeredTools.get("update_product")!;
    await cb({ product_id: "prod_123", name: "Updated" });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/products/prod_123", { name: "Updated" });
  });

  it("should_get_product_with_expand", async () => {
    const cb = registeredTools.get("get_product")!;
    await cb({ product_id: "prod_123", expand: ["default_price"] });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/products/prod_123", { expand: ["default_price"] });
  });

  it("should_delete_product", async () => {
    const cb = registeredTools.get("delete_product")!;
    await cb({ product_id: "prod_123" });
    expect(callApiSpy).toHaveBeenCalledWith("DELETE", "/products/prod_123");
  });

  it("should_list_products_active_only", async () => {
    const cb = registeredTools.get("list_products")!;
    await cb({ active: true });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/products", {
      active: true,
    });
  });
});

describe("Catalog tools — prices", () => {
  it("should_create_recurring_price", async () => {
    const cb = registeredTools.get("create_price")!;
    await cb({
      product: "prod_123",
      unit_amount: 9900,
      currency: "eur",
      recurring: { interval: "month" },
    });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/prices", {
      product: "prod_123",
      unit_amount: 9900,
      currency: "eur",
      recurring: { interval: "month" },
    });
  });

  it("should_update_price", async () => {
    const cb = registeredTools.get("update_price")!;
    await cb({ price_id: "price_123", active: false });
    expect(callApiSpy).toHaveBeenCalledWith("POST", "/prices/price_123", { active: false });
  });

  it("should_get_price", async () => {
    const cb = registeredTools.get("get_price")!;
    await cb({ price_id: "price_123" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/prices/price_123", undefined);
  });

  it("should_list_prices_by_product", async () => {
    const cb = registeredTools.get("list_prices")!;
    await cb({ product: "prod_123", type: "recurring" });
    expect(callApiSpy).toHaveBeenCalledWith("GET", "/prices", {
      product: "prod_123",
      type: "recurring",
    });
  });
});
