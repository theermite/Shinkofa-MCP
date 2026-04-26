# Brief — Prochaine session Shinkofa-MCP

**Cree** : 2026-04-26
**Auteur** : Takumi (handoff post-compaction)
**Contexte** : Jay a demande un audit du pattern MCP avant de construire mcp-playwright. Audit fait, 4 BLOCKING identifies. On corrige les fondations AVANT le nouveau serveur.

---

## Mission

Corriger les 4 BLOCKING identifies dans `docs/audits/QE-V2-Pattern-Audit-2026-04-26.md`, puis construire `mcp-playwright` sur les fondations saines.

---

## Ordre d'execution

### Phase 1 — Foundation (priorite, fait une fois)

1. **`packages/mcp-shared/`** (corrige B3, duplication 22x)
   - Creer le package : `toolResult`, `toolError`, `withErrorHandler<TError>` generique
   - Tests Vitest + coverage
   - Decider strategie : workspace npm ou publish prive
2. **`biome.json` + cleanup ESLint** (corrige B1)
   - Creer config racine
   - Retirer references ESLint dans 22 `package.json`
   - Ajouter `cross-env` en devDep racine ou par projet
3. **`vitest.config.ts` + memory cap** (corrige B2)
   - Config racine ou per-server : `pool: 'forks'`, `maxForks: 2`, `isolate: true`, timeouts 10s
   - Scripts test : `cross-env NODE_OPTIONS=--max-old-space-size=2048 vitest run`
4. **CI workflow** (corrige B4)
   - `.github/workflows/ci.yml` : matrice 22 serveurs
   - tsc, biome, vitest coverage, npm audit, Gitleaks, Semgrep

### Phase 2 — Propagation aux 22 serveurs

Pour chaque serveur :
- Remplacer le `utils.ts` local par import de `@shinkofa/mcp-shared`
- Mettre a jour `package.json` (lint Biome, test memory cap, test:coverage)
- Ajouter `@vitest/coverage-v8` si manquant
- Verifier que les tests passent encore (1 251 tests total)

Atomic commits : 1 commit par serveur ou groupe coherent.

### Phase 3 — WARNING (si energie restante)

5. Scope TLS bypass dans mcp-obsidian via `https.Agent` dedie
6. Ajouter fast-check (PBT) sur tools critiques + StrykerJS mensuel

### Phase 4 — Build mcp-playwright

Sur les fondations corrigees, construire le nouveau serveur en respectant directement le pattern.

---

## Lectures recommandees au demarrage

1. `docs/audits/QE-V2-Pattern-Audit-2026-04-26.md` — l'audit complet
2. `MNK-GoRin/.claude/rules/Quality.md` — sections Test Runtime Hygiene + Lego Library
3. `MNK-GoRin/.claude/rules/Static-Analysis.md` — thresholds Biome, Vitest, etc.
4. Un des serveurs existants (mcp-telegram, le plus simple) — comprendre le pattern actuel

---

## Decisions deja prises

- **Bases saines avant nouveau code** (Jay, 2026-04-26)
- **Pattern actuel a corriger, pas a rebuilder** (audit verdict : "fondamentalement bon")
- **mcp-playwright remplace WebFetch** pour scraper sites JS-rendered (Barbok, Solomonk pour Boken/Dofus Retro)
- **mcp-playwright combine Playwright et autres ?** — Jay avait demande la pertinence, pas de reponse encore. Probablement non : un MCP par concern.

---

## Items en attente non lies

- Boken project : Blueprint, architecture, repo creation (apres mcp-playwright + re-scrape Dofus Retro)
- Bump MNK-GoRin VERSION 4.0.0 -> 4.0.2 + CHANGELOG entries
- Domain decision Boken : recommande `boken.theermite.com`, Jay pas confirme
- Fix UTF-8 accents dans 8 fichiers Obsidian Dofus Retro (batch avec re-scrape Playwright)
