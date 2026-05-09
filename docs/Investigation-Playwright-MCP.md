# Investigation — Playwright MCP ne se charge pas dans Claude Code

> Date : 2026-05-09
> Statut : RESOLU
> Tentatives echouees : 6+ sessions

---

## Symptome

Le MCP Playwright est configure, le serveur demarre correctement en standalone, mais les outils ne sont **jamais disponibles** dans les sessions Claude Code. A chaque session, la reponse etait "relance la session" — ce qui n'a jamais resolu le probleme.

---

## Causes identifiees (cumulatives)

### 1. Config au mauvais emplacement (CAUSE PRINCIPALE)

La config MCP etait dans `~/.claude/settings.json` sous la cle `mcpServers`. Or, Claude Code lit les serveurs MCP depuis `~/.claude.json` (scope user) et les fichiers `.mcp.json` au niveau projet — **pas** depuis `~/.claude/settings.json`.

### 2. `npx` comme commande de lancement (CAUSE SECONDAIRE)

La config utilisait `"command": "npx"` avec `"args": ["@playwright/mcp", "--headless"]`. Problemes :

- `npx` fait un **registry lookup npm a chaque demarrage** (pas de version pinnee)
- Claude Code a un **timeout MCP de 10-30 secondes** pour la connexion
- Sur le VPS, le registry lookup + resolution + demarrage depassait le timeout
- Le serveur ne completait jamais le handshake MCP a temps

References :
- anthropics/claude-code#34891 — les MCP via npx echouent systematiquement
- anthropics/claude-code#3426 — `tools/list` timeout a 30s, outils jamais enregistres

### 3. Version 0.0.75 = alpha (CAUSE POTENTIELLE)

- microsoft/playwright-mcp#1359 — versions 0.0.56+ cassent la compat avec Claude Code
- La version 0.0.41 est la derniere confirmee fonctionnelle
- Notre v0.0.75 est une alpha (`1.61.0-alpha-*`)

---

## Historique des tentatives

| # | Session | Action | Resultat |
|---|---------|--------|----------|
| 1-6 | Avant 2026-05-09 | "Relance la session" | Echec — aucune recherche faite |
| 7 | 2026-05-09 | Recherche web + diagnostic local | Causes identifiees |

---

## Fix applique (2026-05-09)

### Avant (ne marchait pas)

```json
// ~/.claude/settings.json (MAUVAIS FICHIER)
"mcpServers": {
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp", "--headless"]
  }
}
```

### Apres (fonctionne)

```json
// ~/.claude.json (BON FICHIER — via `claude mcp add -s user`)
"playwright": {
  "type": "stdio",
  "command": "node",
  "args": [
    "/home/ubuntu/apps/Shinkofa-MCP/servers/mcp-playwright/dist/index.js"
  ],
  "env": {
    "PLAYWRIGHT_HEADLESS": "true",
    "PLAYWRIGHT_TIMEOUT": "30000"
  }
}
```

Changements cles :
- **Fichier** : `~/.claude.json` au lieu de `~/.claude/settings.json`
- **Commande** : `node` direct au lieu de `npx` (elimine le registry lookup)
- **Serveur** : custom server local au lieu du package npm
- **Ajout via** : `claude mcp add -s user` (methode recommandee)

### Verification

```
$ claude mcp list
playwright: node /home/ubuntu/apps/Shinkofa-MCP/servers/mcp-playwright/dist/index.js - Connected
```

---

## Autres MCPs impactes

Les serveurs suivants etaient dans `~/.claude/.mcp.json` (fichier egalement non lu par Claude Code) et doivent etre migres de la meme facon :

- **imagemagick**
- **discord**
- **telegram**

---

## Lecons

1. **Faire la recherche AVANT de proposer "relance la session"** — 6 sessions perdues
2. **`npx` est fragile pour les MCP** — toujours utiliser `node` direct avec un path absolu
3. **Le bon fichier de config MCP est `~/.claude.json`**, pas `~/.claude/settings.json`
4. **`claude mcp add -s user`** est la methode fiable pour ajouter un MCP
5. **Documenter les echecs** — chaque tentative ratee est une donnee utile

---

## References

- [microsoft/playwright-mcp#1359](https://github.com/microsoft/playwright-mcp/issues/1359) — versions 0.0.56+ cassent Claude Code
- [anthropics/claude-code#3426](https://github.com/anthropics/claude-code/issues/3426) — tools/list timeout
- [anthropics/claude-code#34891](https://github.com/anthropics/claude-code/issues/34891) — npx MCP fail
- [anthropics/claude-code#1383](https://github.com/anthropics/claude-code/issues/1383) — Playwright MCP frequently fails
- [Playwright MCP Config Options](https://playwright.dev/mcp/configuration/options)
