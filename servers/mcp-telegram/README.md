# @shinkofa/mcp-telegram

MCP server for Telegram Bot API — full coverage with typed tools + raw mode.

## Installation

```bash
cd tools/mcp-telegram && pnpm install && pnpm build
```

## Configuration

### Claude Code (`~/.claude/settings.json` or project settings)

```json
{
  "mcpServers": {
    "telegram": {
      "command": "node",
      "args": ["D:/30-Dev-Projects/Shinkofa-Ecosystem/tools/mcp-telegram/dist/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "123456:ABC-DEF..."
      }
    }
  }
}
```

### KOSHIN (Python MCP client)

Connect via stdio transport to the same binary. The MCP protocol is standard JSON-RPC.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | — | Bot token from @BotFather |
| `TELEGRAM_API_BASE_URL` | No | `https://api.telegram.org` | Custom API server URL |
| `TELEGRAM_TIMEOUT_MS` | No | `30000` | Request timeout in ms |

## Tools Reference

### Messages (9 tools)

| Tool | Description |
|------|-------------|
| `send_message` | Send a text message to a chat, group, or channel |
| `edit_message_text` | Edit the text of an existing message |
| `delete_message` | Delete a single message |
| `delete_messages` | Delete multiple messages at once (max 100) |
| `forward_message` | Forward a message from one chat to another |
| `copy_message` | Copy a message without linking to the original |
| `pin_message` | Pin a message in a chat |
| `unpin_message` | Unpin a message (or the most recent pinned message) |
| `set_reaction` | Set reactions on a message |

### Media (5 tools)

| Tool | Description |
|------|-------------|
| `send_media` | Send photo, video, document, audio, voice, animation, video_note, or sticker |
| `send_media_group` | Send 2-10 media files as an album |
| `send_location` | Send a geographic location (optionally live) |
| `send_contact` | Send a phone contact |
| `send_poll` | Send a poll or quiz |

### Chat Management (18 tools)

| Tool | Description |
|------|-------------|
| `get_chat` | Get full information about a chat |
| `get_chat_member` | Get information about a specific member |
| `get_chat_member_count` | Get the number of members |
| `get_chat_administrators` | Get a list of administrators |
| `set_chat_title` | Change the title of a group or channel |
| `set_chat_description` | Change the description |
| `set_chat_permissions` | Set default permissions for all members |
| `ban_chat_member` | Ban a user |
| `unban_chat_member` | Unban a user |
| `restrict_chat_member` | Restrict a user's permissions |
| `promote_chat_member` | Promote or demote an administrator |
| `create_invite_link` | Create an additional invite link |
| `export_invite_link` | Generate a new primary invite link |
| `create_forum_topic` | Create a new forum topic in a supergroup |
| `edit_forum_topic` | Edit name or icon of a forum topic |
| `close_forum_topic` | Close a forum topic |
| `reopen_forum_topic` | Reopen a closed forum topic |
| `delete_forum_topic` | Delete a forum topic and all its messages |

### Bot Management (8 tools)

| Tool | Description |
|------|-------------|
| `get_me` | Get basic information about the bot |
| `set_my_commands` | Set the bot's command list |
| `get_my_commands` | Get the current command list |
| `delete_my_commands` | Delete the command list |
| `set_webhook` | Set a webhook URL for incoming updates |
| `delete_webhook` | Remove the webhook integration |
| `get_webhook_info` | Get current webhook status |
| `get_updates` | Get incoming updates via long polling |

### Payments (2 tools)

| Tool | Description |
|------|-------------|
| `send_invoice` | Send an invoice for payment (fiat or Telegram Stars) |
| `get_star_transactions` | Get the bot's Telegram Stars transaction history |

### Raw (1 tool — 100% API coverage)

| Tool | Description |
|------|-------------|
| `raw_api_call` | Call any Telegram Bot API method directly |

Use `raw_api_call` for any method not exposed as a dedicated tool:

```
raw_api_call({ method: "sendChecklist", params: { chat_id: 123, checklist: [...] } })
raw_api_call({ method: "verifyUser", params: { user_id: 456 } })
raw_api_call({ method: "postStory", params: { ... } })
raw_api_call({ method: "sendGift", params: { ... } })
```

This covers all 100+ Bot API 9.5 methods including business accounts, stories, gifts, verification, games, passport, stickers, inline mode, and any future additions.

## Architecture

```
src/
├── index.ts              # MCP server entry point (stdio transport)
├── lib/
│   ├── client.ts         # Telegram Bot API HTTP client (fetch-based)
│   ├── schemas.ts        # Zod validation schemas for all tool inputs
│   └── utils.ts          # Response formatting helpers
└── tools/
    ├── messages.ts       # send, edit, delete, forward, copy, pin, react
    ├── media.ts          # photo, video, audio, doc, location, poll
    ├── chat.ts           # info, settings, moderation, invites, forum topics
    ├── bot.ts            # bot info, commands, webhook, updates, payments
    └── raw.ts            # raw_api_call for 100% coverage
```

## Development

```bash
pnpm test           # Run tests (36 tests)
pnpm build          # Build to dist/
pnpm type-check     # TypeScript check
```

## API Coverage

- **Dedicated tools**: 42 tools covering the most common operations
- **raw_api_call**: Access to ALL 100+ Telegram Bot API 9.5 methods
- **Total coverage**: 100%
