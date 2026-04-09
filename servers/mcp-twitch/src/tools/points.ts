/**
 * Channel Points tools — custom rewards CRUD + redemption management.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TwitchClient } from "../lib/client.js";
import {
  GetCustomRewardsSchema, CreateCustomRewardSchema, UpdateCustomRewardSchema,
  DeleteCustomRewardSchema, GetRedemptionsSchema, UpdateRedemptionStatusSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerPointsTools(server: McpServer, client: TwitchClient): void {
  server.tool("get_custom_rewards", "Get channel point rewards", GetCustomRewardsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/channel_points/custom_rewards", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("create_custom_reward", "Create a channel point reward", CreateCustomRewardSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, ...body } = p;
      return toolResult(await client.callApi("POST", "/channel_points/custom_rewards", body, { broadcaster_id }));
    })
  );

  server.tool("update_custom_reward", "Update a channel point reward", UpdateCustomRewardSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, id, ...body } = p;
      return toolResult(await client.callApi("PATCH", "/channel_points/custom_rewards", body, { broadcaster_id, id }));
    })
  );

  server.tool("delete_custom_reward", "Delete a channel point reward", DeleteCustomRewardSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("DELETE", "/channel_points/custom_rewards", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("get_redemptions", "Get redemptions for a channel point reward", GetRedemptionsSchema.shape, async (p) =>
    withErrorHandler(async () =>
      toolResult(await client.callApi("GET", "/channel_points/custom_rewards/redemptions", undefined, p as Record<string, string | number | boolean | string[] | undefined>))
    )
  );

  server.tool("update_redemption_status", "Fulfill or cancel a channel point redemption", UpdateRedemptionStatusSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { broadcaster_id, reward_id, id, status } = p;
      const ids = Array.isArray(id) ? id : [id];
      return toolResult(await client.callApi("PATCH", "/channel_points/custom_rewards/redemptions", { status }, { broadcaster_id, reward_id, id: ids }));
    })
  );
}
