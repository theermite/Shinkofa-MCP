import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StripeClient } from "../lib/client.js";
import { CreateCustomerSchema, UpdateCustomerSchema, GetCustomerSchema, ListCustomersSchema, SearchCustomersSchema, DeleteCustomerSchema } from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerCustomerTools(server: McpServer, client: StripeClient): void {
  server.tool("create_customer", "Create a Stripe customer", CreateCustomerSchema.shape, async (p) => {
    return toolResult(await client.callApi("POST", "/customers", p));
  });
  server.tool("update_customer", "Update a customer", UpdateCustomerSchema.shape, async (p) => {
    const { customer_id, ...params } = p;
    return toolResult(await client.callApi("POST", `/customers/${customer_id}`, params));
  });
  server.tool("get_customer", "Get a customer by ID", GetCustomerSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/customers/${p.customer_id}`, p.expand ? { expand: p.expand } : undefined));
  });
  server.tool("list_customers", "List customers", ListCustomersSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/customers", p as Record<string, unknown>));
  });
  server.tool("search_customers", "Search customers", SearchCustomersSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", "/customers/search", p as Record<string, unknown>));
  });
  server.tool("delete_customer", "Delete a customer", DeleteCustomerSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/customers/${p.customer_id}`));
  });
}
