# MCP Servers — Plan & Suivi

> Source de verite pour tous les MCP Shinkofa : existants, planifies, progression.
> Derniere mise a jour : 2026-04-13.

---

## Production (22 MCPs — 739 tools, 2 048 tests)

Tous : TypeScript, withErrorHandler, Zod, Vitest, build tsup, zero type errors.

| MCP | Tools | Tests | Sert a |
|-----|------:|------:|--------|
| mcp-discord | 108 | 235 | Koshin, communaute |
| mcp-docker | 44 | 86 | Koshin, infra |
| mcp-ffmpeg | 20 | 70 | Streaming, contenu video |
| mcp-gmail | 34 | 171 | Koshin, communication |
| mcp-google-calendar | 29 | 152 | Koshin, planning |
| mcp-google-drive | 14 | 112 | Koshin, fichiers |
| mcp-home-assistant | 18 | 86 | Domotique (en attente) |
| mcp-imagemagick | 21 | 34 | Contenu images |
| mcp-n8n | 28 | 50 | Koshin, automatisation |
| mcp-obs | 71 | 25 | Streaming |
| mcp-obsidian | 18 | 95 | Koshin, memoire projet |
| mcp-streamerbot | 15 | 46 | Streaming |
| mcp-stripe | 79 | 162 | Paiement, facturation |
| mcp-telegram | 43 | 109 | Koshin, communication |
| mcp-twitch | 83 | 137 | Streaming |
| mcp-youtube | 47 | 108 | Contenu, streaming |
| mcp-ollama | 14 | 66 | Koshin, Shizen (local LLM) |
| mcp-devto | 16 | 63 | Pipeline contenu |
| mcp-hashnode | 16 | 45 | Pipeline contenu |
| mcp-linkedin | 7 | 51 | Pipeline contenu |
| mcp-tailscale | 16 | 81 | Koshin, reseau |
| mcp-system | 14 | 64 | Koshin, infra locale |

---

## Sprint 1 — Koshin + Pipeline + Infra

| # | MCP | API / Protocole | Auth | Rate Limits | Projets | Status |
|---|-----|----------------|------|-------------|---------|--------|
| 1 | mcp-ollama | Ollama REST (localhost:11434) | Aucune | Illimitee (local) | Koshin, Shizen | [x] Done (14 tools, 66 tests) |
| 2 | mcp-cloudflare | Cloudflare API v4 | API Token (self-service) | 1 200 req/5min | Koshin, infra | [ ] A faire |
| 3 | mcp-devto | DEV.to REST API | API Key (self-service) | 30 req/30s (write), 10 req/30s (search) | Pipeline contenu | [x] Done (16 tools, 63 tests) |
| 4 | mcp-hashnode | Hashnode GraphQL API | Personal Access Token | Non documente | Pipeline contenu | [x] Done (16 tools, 45 tests) |
| 5 | mcp-linkedin | LinkedIn Posts API (w_member_social) | OAuth2 (Share on LinkedIn, self-service) | 150 req/jour/member, token 60j | Pipeline contenu | [x] Done (7 tools, 51 tests) |
| 6 | mcp-tailscale | Tailscale REST API | API Key (self-service) | Non documente | Koshin, reseau | [x] Done (16 tools, 81 tests) |
| 7 | mcp-cpanel | cPanel UAPI / API2 | API Token (cree dans cPanel) | Non documente | O2Switch, tout hebergement cPanel | [ ] A faire |
| 8 | mcp-system | OS natif (Win32 + Linux) | Aucune (local) | N/A | Koshin, migration Windows→Linux | [x] Done (14 tools, 64 tests) |

---

## Sprint 2 — Kakusei Core (gaming/esport)

| # | MCP | API / Protocole | Auth | Rate Limits | Jeux couverts | Status |
|---|-----|----------------|------|-------------|---------------|--------|
| 9 | mcp-riot-games | Riot Games API (REST) | API Key (dev: 24h auto, prod: approbation 1-3 sem.) | Dev: 20/s, 100/2min | LoL, Valorant, TFT, Wild Rift, LoR | [ ] A faire |
| 10 | mcp-steam | Steam Web API (REST) | API Key (self-service, compte non-limite requis) | 100 000/jour | Profils, jeux, achievements, stats | [ ] A faire |
| 11 | mcp-blizzard | Battle.net API (REST, OAuth2) | Client ID + Secret (self-service) | 36 000/h, 100/s | WoW, Diablo, Hearthstone, StarCraft 2 | [ ] A faire |
| 12 | mcp-faceit | FACEIT Data API (REST) | API Key (self-service) | 10 000/h | CS2, Valorant, Dota 2, Rocket League | [ ] A faire |

---

## Sprint 3 — Kakusei Extension

| # | MCP | API / Protocole | Auth | Rate Limits | Jeux couverts | Status |
|---|-----|----------------|------|-------------|---------------|--------|
| 13 | mcp-opendota | OpenDota REST API | Optionnel (gratuit sans cle) | 50 000/mois (avec cle), 2 000/jour (sans) | Dota 2 (matchs parses, telemetrie) | [ ] A faire |
| 14 | mcp-pubg | PUBG REST API | JWT API Key (self-service) | 10/min (extensible sur demande) | PUBG PC + console | [ ] A faire |
| 15 | mcp-supercell | Supercell REST APIs (3 portails) | API Key par jeu (IP-locked, self-service) | 10 req/s/token | Clash of Clans, Clash Royale, Brawl Stars | [ ] A faire |
| 16 | mcp-osu | osu! REST API v2 (OAuth2) | Client ID + Secret (self-service) | ~60/min | osu! | [ ] A faire |
| 17 | mcp-wargaming | Wargaming REST API | Application ID (self-service) | Moderee (header-based) | World of Tanks, Warships, Warplanes | [ ] A faire |
| 18 | mcp-hypixel | Hypixel REST API | API Key (self-service) | 300/5min | Minecraft PvP (Bedwars, Skywars...) | [ ] A faire |
| 19 | mcp-chess | Chess.com REST + Lichess REST | Aucune (Chess.com), OAuth2 optionnel (Lichess) | Genereux | Chess.com + Lichess | [ ] A faire |

---

## Optionnel / A evaluer

| MCP | API | Notes |
|-----|-----|-------|
| mcp-dofusdude | Dofusdude community REST (pas Ankama officiel) | Encyclopedie Dofus uniquement (items, sets, almanax). Pas de stats joueurs. |
| mcp-fortnite | fortnite-api.com (tierce, pas Epic officiel) | Stats joueurs, shop, cosmetics. API tierce = fragile. |
| mcp-apex | apexlegendsapi.com (tierce, pas EA officiel) | Stats joueurs, rotations. API tierce = fragile. |
| mcp-r6siege | r6data.eu (tierce, pas Ubisoft officiel) | Stats joueurs R6 Siege. API tierce = fragile. |
| mcp-resend | Resend REST API | Email transactionnel. A considerer si on quitte le SMTP pur. |

---

## APIs sans acces viable (pas de MCP possible)

| Jeu / Plateforme | Raison |
|------------------|--------|
| EA Sports FC (FIFA) | Pas d'API publique |
| Rocket League | Acces restreint (contacter Psyonix) |
| Overwatch 2 | Blizzard n'a jamais publie d'API |
| Honor of Kings | Pas d'API publique (scrapers fragiles uniquement) |
| Mobile Legends | Pas d'API publique (scrapers fragiles uniquement) |
| Ankama (stats joueurs) | Pas d'API officielle (Dofusdude = encyclopedie seulement) |

---

## Standards de qualite (non-negociable)

Chaque MCP doit respecter :

- [ ] TypeScript ESM, Zod validation
- [ ] `withErrorHandler` sur chaque tool (classe d'erreur custom + Error generique)
- [ ] `toolResult(undefined)` retourne `{"status":"success"}`
- [ ] Fichiers < 300 lignes (hook-enforced)
- [ ] Tests Vitest (schemas, utils/error handler, tool registration, client/config)
- [ ] Build tsup clean, zero erreurs TypeScript
- [ ] Commit atomique avec Co-Authored-By

## Stack

| Composant | Technologie |
|-----------|-------------|
| Language | TypeScript (ESM) |
| MCP SDK | `@modelcontextprotocol/sdk` |
| Validation | Zod |
| Build | tsup |
| Tests | Vitest |
| Runtime | Node.js 20+ |
