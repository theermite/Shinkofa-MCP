/**
 * Auto Moderation tools — rules CRUD.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  ListAutoModRulesSchema, GetAutoModRuleSchema,
  CreateAutoModRuleSchema, ModifyAutoModRuleSchema, DeleteAutoModRuleSchema,
} from "../lib/schemas.js";
import { toolResult } from "../lib/utils.js";

export function registerModerationTools(server: McpServer, client: DiscordClient): void {
  server.tool("list_automod_rules", "List all auto-moderation rules in a guild", ListAutoModRulesSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/auto-moderation/rules`));
  });

  server.tool("get_automod_rule", "Get an auto-moderation rule", GetAutoModRuleSchema.shape, async (p) => {
    return toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/auto-moderation/rules/${p.rule_id}`));
  });

  server.tool("create_automod_rule", "Create an auto-moderation rule", CreateAutoModRuleSchema.shape, async (p) => {
    const { guild_id, reason, ...body } = p;
    return toolResult(await client.callApi("POST", `/guilds/${guild_id}/auto-moderation/rules`, body, undefined, reason));
  });

  server.tool("modify_automod_rule", "Modify an auto-moderation rule", ModifyAutoModRuleSchema.shape, async (p) => {
    const { guild_id, rule_id, reason, ...body } = p;
    return toolResult(await client.callApi("PATCH", `/guilds/${guild_id}/auto-moderation/rules/${rule_id}`, body, undefined, reason));
  });

  server.tool("delete_automod_rule", "Delete an auto-moderation rule", DeleteAutoModRuleSchema.shape, async (p) => {
    return toolResult(await client.callApi("DELETE", `/guilds/${p.guild_id}/auto-moderation/rules/${p.rule_id}`, undefined, undefined, p.reason));
  });
}
