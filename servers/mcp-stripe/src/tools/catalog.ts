import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import {
  CreateProductSchema,
  UpdateProductSchema,
  GetProductSchema,
  ListProductsSchema,
  DeleteProductSchema,
  CreatePriceSchema,
  UpdatePriceSchema,
  GetPriceSchema,
  ListPricesSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerCatalogTools(
  server: McpServer,
  client: StripeClient,
): void {
  // Products
  server.tool(
    "create_product",
    "Create a product",
    CreateProductSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            "/products",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "update_product",
    "Update a product",
    UpdateProductSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { product_id, ...params } = p;
        return toolResult(
          await client.callApi(
            "POST",
            `/products/${encodeURIComponent(product_id)}`,
            params,
          ),
        );
      }),
  );

  server.tool(
    "get_product",
    "Get a product",
    GetProductSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            `/products/${encodeURIComponent(p.product_id)}`,
            p.expand ? { expand: p.expand } : undefined,
          ),
        ),
      ),
  );

  server.tool(
    "list_products",
    "List products",
    ListProductsSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            "/products",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "delete_product",
    "Delete a product",
    DeleteProductSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "DELETE",
            `/products/${encodeURIComponent(p.product_id)}`,
          ),
        ),
      ),
  );

  // Prices
  server.tool(
    "create_price",
    "Create a price (one-time or recurring)",
    CreatePriceSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "POST",
            "/prices",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );

  server.tool(
    "update_price",
    "Update a price",
    UpdatePriceSchema.shape,
    async (p) =>
      withErrorHandler(async () => {
        const { price_id, ...params } = p;
        return toolResult(
          await client.callApi(
            "POST",
            `/prices/${encodeURIComponent(price_id)}`,
            params,
          ),
        );
      }),
  );

  server.tool(
    "get_price",
    "Get a price",
    GetPriceSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            `/prices/${encodeURIComponent(p.price_id)}`,
            p.expand ? { expand: p.expand } : undefined,
          ),
        ),
      ),
  );

  server.tool(
    "list_prices",
    "List prices",
    ListPricesSchema.shape,
    async (p) =>
      withErrorHandler(async () =>
        toolResult(
          await client.callApi(
            "GET",
            "/prices",
            p as Record<string, unknown>,
          ),
        ),
      ),
  );
}
