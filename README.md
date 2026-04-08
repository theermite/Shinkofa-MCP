# Shinkofa MCP Servers

Custom MCP (Model Context Protocol) servers for the Shinkofa ecosystem.

## Servers

| Server | Description | Tools | Status |
|--------|-------------|-------|--------|
| mcp-telegram | Telegram Bot API 9.5 — messages, media, groups, stickers, payments | 42+ | Complete |
| mcp-ffmpeg | FFmpeg/FFprobe — transcode, probe, concat, mix, subtitles, GPU | 20+ | Complete |
| mcp-stripe | Stripe API — customers, payments, subscriptions, invoices, webhooks | 25+ | Complete |
| mcp-discord | Discord REST API v10 — messages, channels, guilds, roles, reactions | 17+ | Complete |
| mcp-twitch | Twitch Helix API — streams, users, clips, channels, subscriptions | 12+ | Complete |
| mcp-youtube | YouTube Data API — videos, channels, playlists, comments, search | 10+ | Complete |
| mcp-gmail | Gmail API — read, search, compose, labels, threads, attachments | 9+ | Complete |
| mcp-google-calendar | Google Calendar API v3 — events, calendars, reminders, recurring | 8+ | Complete |
| mcp-home-assistant | Home Assistant API — devices, entities, automations, scenes | 6+ | Complete |
| mcp-docker | Docker Engine API — containers, images, volumes, networks, compose | 8+ | Complete |
| mcp-n8n | n8n API — workflows, executions, credentials, webhooks | 6+ | Complete |
| mcp-obsidian | Obsidian Local REST API — notes, search, vault management | 5+ | Complete |
| mcp-imagemagick | ImageMagick CLI — convert, resize, effects, composition, batch | 7+ | Complete |

## Tech Stack

- TypeScript
- Zod validation
- Dual transport: stdio + HTTP/SSE
- Vitest for tests

## Usage

Each server runs standalone:

```bash
cd servers/mcp-telegram
npm install
npm run build
npm start
```

## License

MIT
