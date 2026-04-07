import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import { CreateProductSchema, UpdateProductSchema, GetProductSchema, ListProductsSchema, DeleteProductSchema, CreatePriceSchema, UpdatePriceSchema, GetPriceSchema, ListPricesSchema, CreateCouponSchema, GetCouponSchema, ListCouponsSchema, DeleteCouponSchema, CreatePromoCodeSchema, GetPromoCodeSchema, ListPromoCodesSchema, UpdatePromoCodeSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerCatalogTools(server: McpServer, client: StripeClient): void {
  // Products
  server.tool("create_product", "Create a product", CreateProductSchema.shape, async (p) => { return toolResult(await client.callApi("POST", "/products", p as Record<string, unknown>)); });
  server.tool("update_product", "Update a product", UpdateProductSchema.shape, async (p) => { const { product_id, ...params } = p; return toolResult(await client.callApi("POST", `/products/${product_id}`, params)); });
  server.tool("get_product", "Get a product", GetProductSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/products/${p.product_id}`, p.expand ? { expand: p.expand } : undefined)); });
  server.tool("list_products", "List products", ListProductsSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/products", p as Record<string, unknown>)); });
  server.tool("delete_product", "Delete a product", DeleteProductSchema.shape, async (p) => { return toolResult(await client.callApi("DELETE", `/products/${p.product_id}`)); });

  // Prices
  server.tool("create_price", "Create a price (one-time or recurring)", CreatePriceSchema.shape, async (p) => { return toolResult(await client.callApi("POST", "/prices", p as Record<string, unknown>)); });
  server.tool("update_price", "Update a price", UpdatePriceSchema.shape, async (p) => { const { price_id, ...params } = p; return toolResult(await client.callApi("POST", `/prices/${price_id}`, params)); });
  server.tool("get_price", "Get a price", GetPriceSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/prices/${p.price_id}`, p.expand ? { expand: p.expand } : undefined)); });
  server.tool("list_prices", "List prices", ListPricesSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/prices", p as Record<string, unknown>)); });

  // Coupons
  server.tool("create_coupon", "Create a coupon", CreateCouponSchema.shape, async (p) => { return toolResult(await client.callApi("POST", "/coupons", p as Record<string, unknown>)); });
  server.tool("get_coupon", "Get a coupon", GetCouponSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/coupons/${p.coupon_id}`)); });
  server.tool("list_coupons", "List coupons", ListCouponsSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/coupons", p as Record<string, unknown>)); });
  server.tool("delete_coupon", "Delete a coupon", DeleteCouponSchema.shape, async (p) => { return toolResult(await client.callApi("DELETE", `/coupons/${p.coupon_id}`)); });

  // Promo codes
  server.tool("create_promo_code", "Create a promotion code", CreatePromoCodeSchema.shape, async (p) => { return toolResult(await client.callApi("POST", "/promotion_codes", p as Record<string, unknown>)); });
  server.tool("get_promo_code", "Get a promotion code", GetPromoCodeSchema.shape, async (p) => { return toolResult(await client.callApi("GET", `/promotion_codes/${p.promo_code_id}`)); });
  server.tool("list_promo_codes", "List promotion codes", ListPromoCodesSchema.shape, async (p) => { return toolResult(await client.callApi("GET", "/promotion_codes", p as Record<string, unknown>)); });
  server.tool("update_promo_code", "Update a promotion code", UpdatePromoCodeSchema.shape, async (p) => { const { promo_code_id, ...params } = p; return toolResult(await client.callApi("POST", `/promotion_codes/${promo_code_id}`, params)); });
}
