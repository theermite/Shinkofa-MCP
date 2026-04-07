# Shinkofa MCP Servers

Custom MCP (Model Context Protocol) servers for the Shinkofa ecosystem.

## Servers

### Available (functional)

| Server | Description | Tools | Status |
|--------|-------------|-------|--------|
| mcp-telegram | Telegram Bot API 9.5 — messages, media, groups, stickers | 42+ | Complete |
| mcp-ffmpeg | FFmpeg/FFprobe — transcode, probe, concat, mix, subtitles | 20+ | Complete |

### Planned

| Server | Description | Status |
|--------|-------------|--------|
| mcp-discord | Discord Bot API | Scaffolded |
| mcp-stripe | Stripe payments | Scaffolded |
| mcp-twitch | Twitch API | Scaffolded |
| mcp-youtube | YouTube Data API | Scaffolded |
| mcp-google-calendar | Google Calendar API | Scaffolded |
| mcp-gmail | Gmail API | Scaffolded |
| mcp-home-assistant | Home Assistant API | Scaffolded |
| mcp-docker | Docker Engine API | Scaffolded |
| mcp-n8n | n8n workflow API | Scaffolded |
| mcp-imagemagick | ImageMagick CLI | Scaffolded |

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
