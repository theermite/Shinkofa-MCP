/**
 * Emoji tools — list, get, create, modify, delete guild emojis.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClient } from "../lib/client.js";
import {
  ListEmojisSchema, GetEmojiSchema, CreateEmojiSchema,
  ModifyEmojiSchema, DeleteEmojiSchema,
} from "../lib/schemas.js";
import { toolResult, withErrorHandler } from "../lib/utils.js";

export function registerEmojiTools(server: McpServer, client: DiscordClient): void {
  server.tool("list_emojis", "List all custom emojis in a guild", ListEmojisSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/emojis`)))
  );

  server.tool("get_emoji", "Get a custom emoji by ID", GetEmojiSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("GET", `/guilds/${p.guild_id}/emojis/${p.emoji_id}`)))
  );

  server.tool("create_emoji", "Create a custom emoji (base64 image)", CreateEmojiSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, reason, ...body } = p;
      return toolResult(await client.callApi("POST", `/guilds/${guild_id}/emojis`, body, undefined, reason));
    })
  );

  server.tool("modify_emoji", "Modify a custom emoji", ModifyEmojiSchema.shape, async (p) =>
    withErrorHandler(async () => {
      const { guild_id, emoji_id, reason, ...body } = p;
      return toolResult(await client.callApi("PATCH", `/guilds/${guild_id}/emojis/${emoji_id}`, body, undefined, reason));
    })
  );

  server.tool("delete_emoji", "Delete a custom emoji", DeleteEmojiSchema.shape, async (p) =>
    withErrorHandler(async () => toolResult(await client.callApi("DELETE", `/guilds/${p.guild_id}/emojis/${p.emoji_id}`, undefined, undefined, p.reason)))
  );
}
