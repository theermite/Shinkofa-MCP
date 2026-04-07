# MCP Servers — Shinkofa Ecosystem

> Custom MCP servers built by Jay The Ermite. Quality-first, 100% API coverage.

## Philosophy

- **Typed tools** for common operations (Zod-validated, clear descriptions)
- **Raw mode** for 100% API coverage (no limitations)
- **Zero dependencies** beyond MCP SDK + Zod
- **Dual transport**: stdio (Claude Code, KOSHIN) + HTTP/SSE (VPS, remote agents)
- **GPU support** where applicable (RTX 4090 NVENC/CUDA)

## Batch 1 — Completed

| MCP | Status | Tests | Tools | Coverage |
|-----|--------|-------|-------|----------|
| [@shinkofa/mcp-telegram](./mcp-telegram/) | Done | 36/36 | 42 + raw | 100% Bot API 9.5 |
| [@shinkofa/mcp-ffmpeg](./mcp-ffmpeg/) | Done | 51/51 | 20 + 2 raw | 100% FFmpeg/FFprobe |

## Batch 1 — Remaining

| MCP | Status | API Source | Estimated Tools |
|-----|--------|------------|-----------------|
| @shinkofa/mcp-stripe | Planned | ~515 endpoints | ~25 + raw |
| @shinkofa/mcp-discord | Planned | ~225 endpoints | ~25 + raw |
| @shinkofa/mcp-twitch | Planned | ~115 REST + 80 EventSub | ~20 + raw |
| @shinkofa/mcp-calendar | Planned | 36 methods | ~12 + raw |

## Batch 2 — Planned

| MCP | Priority |
|-----|----------|
| @shinkofa/mcp-docker | High |
| @shinkofa/mcp-ovh | High |
| @shinkofa/mcp-cloudflare | High |
| @shinkofa/mcp-n8n | High |
| @shinkofa/mcp-ollama | High |
| @shinkofa/mcp-deepl | High |
| @shinkofa/mcp-github | High |
| @shinkofa/mcp-stripe | High |
| @shinkofa/mcp-calcom | High |
| @shinkofa/mcp-home-assistant | High |
| @shinkofa/mcp-gmail | Medium |
| @shinkofa/mcp-obsidian | Medium |
| @shinkofa/mcp-bitwarden | Medium |
| @shinkofa/mcp-chrome | Medium |
| @shinkofa/mcp-vlc | Medium |
| @shinkofa/mcp-paypal | Medium |
| @shinkofa/mcp-spotify | Medium |
| @shinkofa/mcp-youtube-live | Medium |
| @shinkofa/mcp-google-meet | Low |
| @shinkofa/mcp-alexa | Low |
| @shinkofa/mcp-resend | Low |
| @shinkofa/mcp-windows | Low |
| @shinkofa/mcp-linux | Low |

## Stack

- **Language**: TypeScript (ESM)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Validation**: Zod
- **Build**: tsup
- **Tests**: Vitest (95%+ coverage target)
- **Runtime**: Node.js 20+

## Quick Setup (Claude Code)

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "telegram": {
      "command": "node",
      "args": ["D:/30-Dev-Projects/Shinkofa-Ecosystem/tools/mcp-telegram/dist/index.js"],
      "env": { "TELEGRAM_BOT_TOKEN": "your-token" }
    },
    "ffmpeg": {
      "command": "node",
      "args": ["D:/30-Dev-Projects/Shinkofa-Ecosystem/tools/mcp-ffmpeg/dist/index.js"]
    }
  }
}
```
