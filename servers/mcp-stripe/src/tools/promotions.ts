import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import {
  CreateCouponSchema,
  GetCouponSchema,
  ListCouponsSchema,
  DeleteCouponSchema,
  CreatePromoCodeSchema,
  GetPromoCodeSchema,
  ListPromoCodesSchema,
  UpdatePromoCodeSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerPromotionTools(
  server: McpServer,
  client: StripeClient,
): void {
  // Coupons
  server.tool(
    "create_coupon",
    "Create a coupon",
    CreateCouponSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            "/coupons",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "get_coupon",
    "Get a coupon",
    GetCouponSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            `/coupons/${encodeURIComponent(p.coupon_id)}`,
          ),
        ),
      ),
  );

  server.tool(
    "list_coupons",
    "List coupons",
    ListCouponsSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            "/coupons",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "delete_coupon",
    "Delete a coupon",
    DeleteCouponSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "DELETE",
            `/coupons/${encodeURIComponent(p.coupon_id)}`,
          ),
        ),
      ),
  );

  // Promo codes
  server.tool(
    "create_promo_code",
    "Create a promotion code",
    CreatePromoCodeSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            "/promotion_codes",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "get_promo_code",
    "Get a promotion code",
    GetPromoCodeSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            `/promotion_codes/${encodeURIComponent(p.promo_code_id)}`,
          ),
        ),
      ),
  );

  server.tool(
    "list_promo_codes",
    "List promotion codes",
    ListPromoCodesSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            "/promotion_codes",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "update_promo_code",
    "Update a promotion code",
    UpdatePromoCodeSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { promo_code_id, ...params } = p;
        return toolResult(
          await client.callApi(
            "POST",
            `/promotion_codes/${encodeURIComponent(promo_code_id)}`,
            params,
          ),
        );
      }),
  );
}
