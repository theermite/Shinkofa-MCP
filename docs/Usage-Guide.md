# Guide d'utilisation des MCPs Shinkofa

> Comment connecter un projet Shinkofa aux 23 serveurs MCP.
> Derniere mise a jour : 2026-05-06.

---

## Architecture

```
┌─────────────────┐     stdio      ┌──────────────┐
│  Claude Code    │ ◄────────────► │  mcp-server  │
└─────────────────┘                └──────────────┘

┌─────────────────┐   HTTP/JSON    ┌──────────────┐
│  Kobo (Elixir)  │ ◄────────────► │  mcp-server  │  ← Tailscale (reseau prive)
│  Koshin (TS)    │     :9001      │  (PM2/systemd)│
└─────────────────┘                └──────────────┘
```

Chaque serveur supporte **deux transports** :
- **stdio** (defaut) — pour Claude Code, usage local
- **Streamable HTTP** — pour acces reseau (Kobo, Koshin, tout client MCP)

---

## 1. Usage avec Claude Code (stdio — aucune config necessaire)

Claude Code utilise les MCPs via stdio. La config se fait dans `~/.claude/.mcp.json` ou dans le `.mcp.json` du projet.

### Config globale VPS (`~/.claude/.mcp.json`)

```json
{
  "mcpServers": {
    "mcp-system": {
      "command": "npx",
      "args": ["tsx", "/home/ubuntu/apps/Shinkofa-MCP/servers/mcp-system/src/index.ts"],
      "env": {
        "MCP_SYSTEM_ALLOW_EXEC": "true"
      }
    },
    "mcp-obsidian": {
      "command": "npx",
      "args": ["tsx", "/home/ubuntu/apps/Shinkofa-MCP/servers/mcp-obsidian/src/index.ts"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/vault"
      }
    }
  }
}
```

### Config projet (`.mcp.json` a la racine du repo)

```json
{
  "mcpServers": {
    "mcp-stripe": {
      "command": "npx",
      "args": ["tsx", "/home/ubuntu/apps/Shinkofa-MCP/servers/mcp-stripe/src/index.ts"],
      "env": {
        "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}"
      }
    }
  }
}
```

**Regles** :
- Les variables d'environnement sensibles (tokens, cles) viennent de `.env` ou de l'environnement shell — jamais en dur
- Voir le `.env.example` de chaque serveur pour les variables requises

---

## 2. Usage reseau via HTTP (Kobo, Koshin, clients externes)

### Pre-requis

1. Les serveurs MCP doivent tourner en mode HTTP (via PM2 ou systemd)
2. Un token d'authentification partage entre le serveur et le client
3. Acces reseau (Tailscale recommande — jamais exposer sur internet public)

### Demarrer les serveurs en HTTP

```bash
# Depuis le repo Shinkofa-MCP
cd ~/apps/Shinkofa-MCP

# Definir le token (le meme pour tous les serveurs, stocke dans .env.prod)
export MCP_AUTH_TOKEN=$(cat ~/apps/Shinkofa-Infra/.env.prod | grep MCP_AUTH_TOKEN | cut -d= -f2)

# Demarrer tous les serveurs
pm2 start ecosystem.config.cjs

# Ou un seul serveur
MCP_TRANSPORT=http MCP_AUTH_TOKEN=$MCP_AUTH_TOKEN MCP_HTTP_PORT=9004 npx tsx servers/mcp-system/src/index.ts
```

### Verifier qu'un serveur fonctionne

```bash
# Health check (doit retourner 404 — prouve que le serveur ecoute)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9004/health
# Attend: 404

# Initialize MCP (doit retourner 200 + session ID)
curl -si -X POST http://127.0.0.1:9004/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"healthcheck","version":"1.0"}}}'
# Attend: HTTP 200 + header Mcp-Session-Id
```

---

## 3. Protocole MCP over HTTP — Reference

### Handshake complet

Le protocole MCP Streamable HTTP requiert un handshake en 3 etapes :

```
1. Client → POST /mcp : initialize
2. Server → 200 SSE : result + header Mcp-Session-Id
3. Client → POST /mcp : notifications/initialized (avec header Mcp-Session-Id)
4. Client → POST /mcp : tools/list, tools/call, etc. (avec header Mcp-Session-Id)
```

### Headers requis (toute requete)

| Header | Valeur | Obligatoire |
|--------|--------|-------------|
| `Content-Type` | `application/json` | Oui |
| `Accept` | `application/json, text/event-stream` | Oui |
| `Authorization` | `Bearer <MCP_AUTH_TOKEN>` | Oui |
| `Mcp-Session-Id` | `<uuid>` (recu a l'init) | Apres initialize |

### Format de requete (JSON-RPC 2.0)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "system_info",
    "arguments": {}
  }
}
```

### Format de reponse (SSE)

```
event: message
data: {"result":{"content":[{"type":"text","text":"..."}]},"jsonrpc":"2.0","id":1}
```

Le body est un event stream (text/event-stream). Chaque message est prefixe par `event: message\ndata: `.

---

## 4. Integration depuis Elixir (Kobo)

### Avec `hermes_mcp` ou `ex_mcp`

```elixir
# mix.exs
{:hermes_mcp, "~> 0.x"}

# Client
{:ok, client} = Hermes.Client.start_link(
  transport: :streamable_http,
  url: "http://100.x.x.x:9004/mcp",
  headers: [{"authorization", "Bearer #{System.get_env("MCP_AUTH_TOKEN")}"}]
)

# Appeler un tool
{:ok, result} = Hermes.Client.call_tool(client, "system_info", %{})
```

### Avec HTTP brut (sans lib MCP)

```elixir
defmodule McpClient do
  @base_url "http://100.x.x.x:9004/mcp"
  @headers [
    {"content-type", "application/json"},
    {"accept", "application/json, text/event-stream"},
    {"authorization", "Bearer #{System.get_env("MCP_AUTH_TOKEN")}"}
  ]

  def initialize do
    body = Jason.encode!(%{
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: %{protocolVersion: "2025-03-26", capabilities: %{},
                clientInfo: %{name: "kobo", version: "1.0"}}
    })
    {:ok, %{headers: headers}} = Req.post(@base_url, body: body, headers: @headers)
    # Extraire Mcp-Session-Id des headers de reponse
    session_id = get_header(headers, "mcp-session-id")
    {:ok, session_id}
  end

  def call_tool(session_id, tool_name, args) do
    headers = @headers ++ [{"mcp-session-id", session_id}]
    body = Jason.encode!(%{
      jsonrpc: "2.0", id: 2, method: "tools/call",
      params: %{name: tool_name, arguments: args}
    })
    Req.post(@base_url, body: body, headers: headers)
  end
end
```

---

## 5. Integration depuis TypeScript (Koshin)

### Avec le SDK officiel MCP

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("http://100.x.x.x:9004/mcp"),
  {
    requestInit: {
      headers: {
        Authorization: `Bearer ${process.env.MCP_AUTH_TOKEN}`,
      },
    },
  }
);

const client = new Client({ name: "koshin", version: "1.0" });
await client.connect(transport);

// Lister les tools
const { tools } = await client.listTools();

// Appeler un tool
const result = await client.callTool("system_info", {});
```

### Sans SDK (fetch brut)

```typescript
const MCP_URL = "http://100.x.x.x:9004/mcp";
const headers = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
  Authorization: `Bearer ${process.env.MCP_AUTH_TOKEN}`,
};

// Initialize
const initRes = await fetch(MCP_URL, {
  method: "POST",
  headers,
  body: JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2025-03-26", capabilities: {},
              clientInfo: { name: "koshin", version: "1.0" } }
  }),
});
const sessionId = initRes.headers.get("mcp-session-id");

// tools/call avec session
const res = await fetch(MCP_URL, {
  method: "POST",
  headers: { ...headers, "Mcp-Session-Id": sessionId! },
  body: JSON.stringify({
    jsonrpc: "2.0", id: 2, method: "tools/call",
    params: { name: "system_info", arguments: {} }
  }),
});
```

---

## 6. Port Registry

| Server | Port | Variables requises |
|--------|------|--------------------|
| mcp-stripe | 9001 | `STRIPE_SECRET_KEY` |
| mcp-ffmpeg | 9002 | — |
| mcp-playwright | 9003 | — |
| mcp-system | 9004 | `MCP_SYSTEM_ALLOW_EXEC` (optionnel) |
| mcp-obsidian | 9005 | `OBSIDIAN_VAULT_PATH` |
| mcp-tailscale | 9006 | `TAILSCALE_API_KEY`, `TAILSCALE_TAILNET` |
| mcp-docker | 9007 | — |
| mcp-discord | 9008 | `DISCORD_BOT_TOKEN` |
| mcp-telegram | 9009 | `TELEGRAM_BOT_TOKEN` |
| mcp-gmail | 9010 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` |
| mcp-obs | 9011 | `OBS_WEBSOCKET_URL`, `OBS_WEBSOCKET_PASSWORD` |
| mcp-youtube | 9012 | `YOUTUBE_API_KEY` |
| mcp-twitch | 9013 | `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_ACCESS_TOKEN` |
| mcp-n8n | 9014 | `N8N_BASE_URL`, `N8N_API_KEY` |
| mcp-ollama | 9015 | `OLLAMA_BASE_URL` |
| mcp-google-calendar | 9016 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` |
| mcp-google-drive | 9017 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` |
| mcp-linkedin | 9018 | `LINKEDIN_ACCESS_TOKEN` |
| mcp-devto | 9019 | `DEVTO_API_KEY` |
| mcp-hashnode | 9020 | `HASHNODE_TOKEN` |
| mcp-imagemagick | 9021 | — |
| mcp-home-assistant | 9022 | `HA_BASE_URL`, `HA_TOKEN` |
| mcp-streamerbot | 9023 | `STREAMERBOT_HOST`, `STREAMERBOT_PORT` |

---

## 7. Variables d'environnement transport

| Variable | Defaut | Description |
|----------|--------|-------------|
| `MCP_TRANSPORT` | `stdio` | Mode : `stdio` ou `http` |
| `MCP_HTTP_PORT` | `0` (auto) | Port HTTP (utiliser le registry ci-dessus) |
| `MCP_AUTH_TOKEN` | — | Token obligatoire en mode HTTP |
| `MCP_HTTP_STATELESS` | `false` | Si `true`, pas de session ID (single-request) |

---

## 8. Securite

- **JAMAIS exposer sur internet public** — utiliser Tailscale (reseau prive)
- **Un token par environnement** — dev, staging, prod ont des tokens differents
- Le token est stocke dans `~/apps/Shinkofa-Infra/.env.prod` (variable `MCP_AUTH_TOKEN`)
- Chaque serveur a ses propres credentials API (Stripe key, Discord token, etc.) — voir `.env.example` du serveur
- Le mode stateful genere un session ID par client — rejette les requetes sans session apres initialize

---

## 9. Operations PM2

```bash
# Demarrer tous les MCPs en HTTP
pm2 start ecosystem.config.cjs

# Status
pm2 status

# Logs d'un serveur
pm2 logs mcp-stripe

# Redemarrer un serveur
pm2 restart mcp-stripe

# Arreter tout
pm2 stop all

# Sauvegarder pour redemarrage auto
pm2 save
pm2 startup
```

---

## 10. Troubleshooting

| Symptome | Cause | Fix |
|----------|-------|-----|
| `401 Unauthorized` | Token incorrect ou manquant | Verifier `MCP_AUTH_TOKEN` dans le serveur ET le client |
| `404 Not Found` | Mauvais path | Utiliser `/mcp` uniquement |
| `Not Acceptable` | Headers Accept manquants | Ajouter `Accept: application/json, text/event-stream` |
| `400 Bad Request` | Session ID manquant apres init | Inclure `Mcp-Session-Id` dans les requetes post-initialize |
| `EADDRINUSE` | Port deja occupe | `kill $(lsof -ti:<port>)` ou changer le port |
| Connection refused | Serveur pas lance | `pm2 status` puis `pm2 start ecosystem.config.cjs` |
| Timeout | Tailscale pas connecte | `tailscale status` — verifier que les 2 machines sont up |
