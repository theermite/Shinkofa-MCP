# Shinkofa MCP Servers

> Custom MCP (Model Context Protocol) servers for the Shinkofa ecosystem.
> Built by Jay The Ermite. Quality-first, typed tools, comprehensive tests.

## Production Servers (22)

| Server | Description | Tools | Tests |
|--------|-------------|------:|------:|
| [mcp-devto](servers/mcp-devto/) | DEV.to REST API — articles, comments, tags, reactions, reading list | 16 | 63 |
| [mcp-discord](servers/mcp-discord/) | Discord REST API v10 — messages, channels, guilds, roles, webhooks | 108 | 235 |
| [mcp-docker](servers/mcp-docker/) | Docker Engine API — containers, images, volumes, networks, compose | 44 | 86 |
| [mcp-ffmpeg](servers/mcp-ffmpeg/) | FFmpeg/FFprobe — transcode, probe, edit, compose, extract, GPU | 20 | 70 |
| [mcp-gmail](servers/mcp-gmail/) | Gmail API — read, search, compose, labels, threads, attachments | 34 | 171 |
| [mcp-google-calendar](servers/mcp-google-calendar/) | Google Calendar API v3 — events, calendars, reminders, recurring | 29 | 152 |
| [mcp-google-drive](servers/mcp-google-drive/) | Google Drive API v3 — files, folders, read/export, upload, share | 14 | 112 |
| [mcp-hashnode](servers/mcp-hashnode/) | Hashnode GraphQL API — posts, drafts, series, comments, profile | 16 | 45 |
| [mcp-home-assistant](servers/mcp-home-assistant/) | Home Assistant API — devices, entities, automations, scenes | 18 | 86 |
| [mcp-imagemagick](servers/mcp-imagemagick/) | ImageMagick CLI — convert, resize, effects, composition, batch | 21 | 34 |
| [mcp-linkedin](servers/mcp-linkedin/) | LinkedIn Posts API — text, articles, images, profile | 7 | 51 |
| [mcp-n8n](servers/mcp-n8n/) | n8n API — workflows, executions, credentials, webhooks | 28 | 50 |
| [mcp-obs](servers/mcp-obs/) | OBS Studio WebSocket v5 — scenes, sources, streaming, recording, filters | 71 | 25 |
| [mcp-obsidian](servers/mcp-obsidian/) | Obsidian Local REST API — notes, search, vault management | 18 | 95 |
| [mcp-ollama](servers/mcp-ollama/) | Ollama REST API — generate, chat, embed, model management | 14 | 66 |
| [mcp-streamerbot](servers/mcp-streamerbot/) | Streamer.bot WebSocket — actions, chat, events, globals, triggers | 15 | 46 |
| [mcp-stripe](servers/mcp-stripe/) | Stripe API — customers, payments, subscriptions, invoices, webhooks | 79 | 162 |
| [mcp-system](servers/mcp-system/) | OS system introspection (Win32+Linux+macOS) — CPU, memory, disk, processes, exec (gated) | 14 | 64 |
| [mcp-tailscale](servers/mcp-tailscale/) | Tailscale API v2 — devices, auth keys, ACL (HuJSON), DNS | 16 | 81 |
| [mcp-telegram](servers/mcp-telegram/) | Telegram Bot API — messages, media, groups, stickers, payments | 43 | 109 |
| [mcp-twitch](servers/mcp-twitch/) | Twitch Helix API — streams, users, clips, channels, subscriptions | 83 | 137 |
| [mcp-youtube](servers/mcp-youtube/) | YouTube Data API — videos, channels, playlists, comments, search | 47 | 108 |

**Total: 739 tools, 2 048 tests.**

## Philosophy

- **Typed tools** for common operations (Zod-validated, clear descriptions)
- **withErrorHandler** on every tool (custom error classes, never crash the MCP server)
- **Zero unnecessary dependencies** — MCP SDK + Zod + service-specific client only
- **Dual transport**: stdio (Claude Code, Koshin) + HTTP/SSE (VPS, remote agents)
- **Modular**: each tool group in its own file (<300 lines)

## Tech Stack

- **Language**: TypeScript (ESM)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Validation**: Zod
- **Build**: tsup
- **Tests**: Vitest
- **Runtime**: Node.js 20+

## Usage

Each server runs standalone:

```bash
cd servers/mcp-telegram
npm install
npm run build
npm start
```

Add to Claude Code MCP settings:

```json
{
  "mcpServers": {
    "telegram": {
      "command": "node",
      "args": ["path/to/servers/mcp-telegram/dist/index.js"],
      "env": { "TELEGRAM_BOT_TOKEN": "your-token" }
    }
  }
}
```

## Roadmap

See [docs/MCP-SERVERS.md](docs/MCP-SERVERS.md) for the full roadmap with planned MCPs.

## License

MIT
