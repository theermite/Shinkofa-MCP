# Brief — Upgrade Streamable HTTP Transport

> Prepared by Takumi from Kobo session 2026-05-05.
> Goal: make all 22 MCP servers network-accessible via official MCP Streamable HTTP transport.

## Context

All 22 Shinkofa-MCP servers currently use **stdio transport only**. This limits them to local Claude Code usage. Kobo (Elixir/Phoenix backend on VPS) needs to connect to these servers remotely over Tailscale.

**MCP Streamable HTTP** is the official network transport (spec 2025-03-26, stable in SDK v1.29). It replaces the deprecated SSE dual-endpoint pattern.

## Objective

Add **dual transport** to all servers: stdio (for Claude Code) + Streamable HTTP (for network access). Zero breaking change — stdio continues to work exactly as before.

## Technical Plan

### Phase 1 — SDK Upgrade + Shared Transport Factory

1. **Upgrade `@modelcontextprotocol/sdk`** from `^1.12.0` to `^1.29.0` in all 22 servers + mcp-shared
2. **Create a shared transport factory** in `packages/mcp-shared/` that handles:
   - Env var `MCP_TRANSPORT=stdio|http` (default: `stdio` for backward compat)
   - When `http`: start HTTP server with `StreamableHTTPServerTransport`
   - Port via `MCP_HTTP_PORT` env var (default: auto-assign)
   - Bearer token auth via `MCP_AUTH_TOKEN` env var (required when http)
3. **Pilot on mcp-system** (14 tools, simplest server) — validate the pattern

### Phase 2 — Rollout to All Servers

4. **Update each server's `index.ts`** — replace manual transport with shared factory:

**Current pattern (all 22 servers):**
```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Target pattern:**
```typescript
import { connectTransport } from "@shinkofa/mcp-shared";
await connectTransport(server); // reads MCP_TRANSPORT env var
```

5. **Update each `package.json`** — bump SDK version
6. **Run tests** on each server after upgrade (2,048 tests total)
7. **Update CI** — add HTTP transport test

### Phase 3 — Documentation + Deployment

8. **Update README** and `docs/MCP-SERVERS.md` with HTTP usage examples
9. **Add deployment config** for tower (systemd services or pm2 for persistent HTTP servers)
10. **Test from VPS** — verify connectivity over Tailscale

## Key Technical Details

### Streamable HTTP Transport (SDK v1.29)

```typescript
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import http from "node:http";

const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

const httpServer = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/mcp") {
    await transport.handleRequest(req, res);
  } else {
    res.writeHead(404).end();
  }
});

httpServer.listen(port);
await server.connect(transport);
```

### Auth (Internal/Tailscale)

Simple bearer token for internal Tailscale access:
```typescript
const authHeader = req.headers.authorization;
if (authHeader !== `Bearer ${process.env.MCP_AUTH_TOKEN}`) {
  res.writeHead(401).end();
  return;
}
```

### New Env Vars

| Var | Default | Description |
|-----|---------|-------------|
| `MCP_TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `MCP_HTTP_PORT` | `0` (auto) | HTTP listen port |
| `MCP_AUTH_TOKEN` | — | Required when `MCP_TRANSPORT=http` |

### Server Port Registry (Tower Deployment)

| Server | Port | Server | Port |
|--------|------|--------|------|
| mcp-stripe | 9001 | mcp-ffmpeg | 9002 |
| mcp-playwright | 9003 | mcp-system | 9004 |
| mcp-obsidian | 9005 | mcp-tailscale | 9006 |
| mcp-docker | 9007 | mcp-discord | 9008 |
| mcp-telegram | 9009 | mcp-gmail | 9010 |
| mcp-obs | 9011 | mcp-youtube | 9012 |
| mcp-twitch | 9013 | mcp-n8n | 9014 |
| mcp-ollama | 9015 | mcp-google-calendar | 9016 |
| mcp-google-drive | 9017 | mcp-linkedin | 9018 |
| mcp-devto | 9019 | mcp-hashnode | 9020 |
| mcp-imagemagick | 9021 | mcp-home-assistant | 9022 |
| mcp-streamerbot | 9023 | — | — |

## Priority Order

1. **mcp-system** (14 tools) — pilot, validate the pattern
2. **mcp-stripe** (79 tools) — Kobo priority
3. **mcp-ffmpeg** (20 tools) — Kobo priority
4. **mcp-playwright** — Kobo priority
5. Remaining 18 servers — mechanical rollout

## Veille Results (2026-05-05)

Research conducted across EN, FR, ZH, JA, DE sources. Key findings:

- **Streamable HTTP** is the official MCP network transport (spec 2025-03-26, production-ready)
- **SDK v1.29.0** is stable, v2.0.0 in alpha (not needed yet)
- **Existing gateways** (supergateway, MetaMCP, Docker MCP Gateway) bridge stdio to HTTP but are unnecessary if servers support HTTP natively
- **OAuth 2.1 + PKCE** is required for public servers; bearer token is acceptable for internal/Tailscale
- **Elixir MCP clients** exist (ex_mcp, hermes_mcp) — Kobo will use one to connect directly
- Sources: modelcontextprotocol.io, GitHub typescript-sdk releases, Cloudflare enterprise MCP reference, zylos.ai research

## Acceptance Criteria

- [x] All 23 servers support `MCP_TRANSPORT=http` (2026-05-06)
- [x] All 23 servers still work with stdio (default, backward compat)
- [x] Bearer token auth enforced on HTTP transport
- [x] 2,200+ tests still pass
- [x] CI tests both transports (transport test step in mcp-shared job)
- [x] `docs/MCP-SERVERS.md` updated with HTTP usage
- [x] Tower deployment config ready (ecosystem.config.cjs — PM2)
- [x] `docs/Usage-Guide.md` — full integration guide for all projects

## Relation to Previous Brief

The previous `Next-Session-Brief.md` (2026-04-26) focused on QE V2 pattern audit fixes (B1-B4) + mcp-playwright build. Those items remain valid. This upgrade can be done:
- **After** the B1-B4 fixes (cleaner foundation), OR
- **In parallel** (SDK upgrade is independent of Biome/Vitest/mcp-shared fixes)

Recommended: do B1-B4 fixes first if not done yet, then this upgrade. The shared transport factory goes in `packages/mcp-shared/` which needs to exist first (B3).
