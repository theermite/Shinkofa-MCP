# Audit QE V2 — Pattern Shinkofa-MCP

**Date** : 2026-04-26
**Serveurs auditeurs** : mcp-telegram, mcp-obsidian, mcp-discord (representatifs des 22)
**Methodologie** : MNK-GoRin Quality Engineering V2 (`MNK-GoRin/.claude/rules/Quality.md`, `Static-Analysis.md`)
**Contexte** : audit demande par Jay AVANT de construire mcp-playwright, pour partir sur des fondations saines.

---

## Verdict global

**FAIL — 4 BLOCKING + 3 WARNING**

Le pattern architectural est sain et coherent. Les lacunes sont **structurelles et transversales** : elles se fixent une fois au niveau repo et beneficient aux 22 serveurs simultanement.

| Dimension | Score | Note |
|-----------|-------|------|
| Foundation (Stack) | PASS | Node ESM, TypeScript strict, Zod, MCP SDK |
| L0 Process (CI/Lint) | **FAIL** | Pas de CI, lint script casse |
| L1 Structural | PASS | Fichiers <300 lignes, fonctions <30 lignes, CC faible |
| L2 Functional | WARNING | Tests existent mais coverage invariable sur obsidian, anti-circular absent |
| Security | WARNING | Zod validation OK, TLS bypass global = risque |
| Maintainability | WARNING | Code partage duplique 22 fois |
| Test Reliability | WARNING | Pas de memory cap, pas de pool config, pas de mutation testing |

---

## Pattern actuel (description)

Tous les 22 serveurs suivent une structure identique :

```
src/
  index.ts            # entry point
  lib/
    client.ts         # typed HTTP wrapper
    schemas.ts        # Zod input schemas
    utils.ts          # toolResult, toolError, withErrorHandler
  tools/*.ts          # tool registration functions
tests/                # mirror src tree
```

Runtime : Node.js ESM, TypeScript strict (`strict: true`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`), Vitest, tsup pour le build. Aucun package partage — chaque serveur est standalone.

---

## Ce qui est solide (a preserver)

- TypeScript strict partout
- Zod sur **chaque input** de tool, aucun passthrough brut
- `withErrorHandler` couvre API errors, timeout (AbortError), reseau (TypeError), JSON malforme (SyntaxError)
- Convention de nommage des tests `should_[action]_when_[condition]`
- Fichiers courts : max 105 lignes (`mcp-discord/src/tools/channels.ts`)
- Cyclomatic complexity faible : ~6-7 max (`callApi` dans `client.ts`)
- Zero secrets hardcodes, tous les tokens via `process.env`
- Zero `console.log` en prod, uniquement `console.error` dans le fatal path
- Volume de tests substantiel : Telegram 109, Obsidian 82, Discord 235 (total 1 251 sur les 22)

---

## BLOCKING (4)

### B1 — Pas de Biome, lint script casse

**Fichiers** : `mcp-telegram/package.json:18`, `mcp-discord/package.json:18`, identique sur les autres.

```json
"lint": "eslint src/"
```

ESLint n'est pas dans `devDependencies`, aucun fichier de config ESLint present. **Le script ne fait rien** (echec silencieux ou jamais lance).

Conventions.md et Static-Analysis.md mandatent **Biome 2.4+** comme linter pre-commit et CI pour TypeScript. Aucun `biome.json` n'existe dans le repo.

**Fix** : creer `biome.json` a la racine, mettre a jour les 22 `package.json` (`"lint": "biome check src/"`), retirer toutes les references ESLint.

### B2 — Pas de memory cap Vitest, pas de pool config

**Fichiers** : `mcp-telegram/package.json:16`, `mcp-discord/package.json:16`, etc.

```json
"test": "vitest run"
```

Aucun `cross-env NODE_OPTIONS=--max-old-space-size=2048`. Aucun `vitest.config.ts` chez 21/22 serveurs (seul mcp-twitch en a un, mais sans pool options).

Per Quality.md (Test Runtime Hygiene, ajoute apres l'incident OOM VPS du 2026-04-23) :
- Tous les scripts `test`/`test:coverage` MUST set memory cap via `cross-env`
- Vitest MUST configure `pool: 'forks'`, `maxForks: 2`, `isolate: true`

Avec 22 serveurs en boucles agentiques paralleles = scenario OOM exact documente.

**Fix** :
1. Creer `vitest.config.ts` racine ou per-server avec `pool: 'forks'`, `maxForks: 2`, `isolate: true`, timeouts 10s
2. Mettre a jour les 22 `package.json` : `"test": "cross-env NODE_OPTIONS=--max-old-space-size=2048 vitest run"`
3. Ajouter `cross-env` en devDependency

### B3 — `toolResult`/`toolError`/`withErrorHandler` dupliques 22 fois

**Fichiers** : `mcp-telegram/src/lib/utils.ts`, `mcp-obsidian/src/lib/utils.ts`, `mcp-discord/src/lib/utils.ts`, etc.

`toolResult` et `toolError` sont **byte-for-byte identiques**. `withErrorHandler` ne differe que par la classe d'erreur API specifique.

Violation directe du Lego First (Quality.md, Workflows.md) : un bug fix dans un serveur = 21 PR manuelles.

**Fix** : creer `D:/30-Dev-Projects/Shinkofa-MCP/packages/mcp-shared/` exposant :
- `toolResult(content)`
- `toolError(message)`
- `withErrorHandler<TError>(fn, errorFormatter)` generique

Propager aux 22 serveurs en un pass.

### B4 — Zero CI

`find "D:/30-Dev-Projects/Shinkofa-MCP" -name "*.yml"` retourne rien. Pas de `.github/workflows/`.

Per QE V2 : `tsc --noEmit`, `biome check`, `vitest run --coverage`, `npm audit --audit-level=high`, Madge (circular), Knip (dead code), Semgrep, Gitleaks doivent tourner en CI.

Les 1 251 tests ne tournent que manuellement.

**Fix** : creer `.github/workflows/ci.yml` avec matrice sur les 22 serveurs.

---

## WARNING (3)

### W1 — TLS bypass global dans mcp-obsidian

**Fichier** : `mcp-obsidian/src/index.ts:22`

```ts
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
```

Mutation **process-wide**, pas scopee au client Obsidian. Tout HTTPS dans le meme process (incluant MCP SDK internals) skip la verification TLS quand le flag est set.

**Fix** : utiliser un `https.Agent` dedie scope au fetch Obsidian, ou minimum documenter comme security boundary.

### W2 — Anti-circular testing absent

Pattern unique des tests : spy `callApi`, call handler, assert spy called with correct args. Verifie le routing **mais pas le comportement divergent** (ex : si une mauvaise methode HTTP est silencieusement utilisee).

Pas de PBT (fast-check), pas de mutation testing (StrykerJS).

Per Quality.md Anti-Circular Testing Protocol : critical paths (et sensitive : user data, webhooks) requierent PBT + mutation. MCP servers ecrivent dans Obsidian vault, envoient sur Telegram = Sensitive.

**Fix** : ajouter fast-check sur les tools les plus critiques + StrykerJS en CI mensuelle.

### W3 — Coverage invariable sur mcp-obsidian

**Fichier** : `mcp-obsidian/package.json:10`

Scripts : seulement `build`, `test`, `type-check`. **Pas de `test:coverage`**, pas de `@vitest/coverage-v8` en devDependencies.

Le floor 80% (Quality.md) est invariable sur ce serveur. **Auditer les 21 autres pour le meme gap.**

**Fix** : ajouter `@vitest/coverage-v8` partout ou manquant + script `"test:coverage": "cross-env NODE_OPTIONS=--max-old-space-size=2048 vitest run --coverage"`.

Trivial test note : `mcp-obsidian/tests/tools.test.ts:7` contient `should_register_all_18_tools` qui verifie uniquement le wiring (count + toContain). 1/82 = sous le seuil 10% trivial, mais signal que tools.test.ts n'a aucun coverage comportemental.

---

## Plan de correction (ordre recommande)

### Phase 1 — Foundation (BLOCKING)

1. **Creer `packages/mcp-shared/`** (B3)
   - `toolResult`, `toolError`, `withErrorHandler<TError>` generique
   - Tests Vitest, coverage, build tsup
   - Publish strategy : workspace ou npm prive ?
2. **`biome.json` racine + cleanup ESLint** (B1)
3. **`vitest.config.ts` + `cross-env` partout** (B2)
4. **CI workflow GitHub Actions** (B4)
   - Matrice 22 serveurs : tsc, biome, vitest coverage, npm audit
   - Gitleaks + Semgrep transversal

### Phase 2 — Propagation aux 22 serveurs

Pour chaque serveur :
- Importer `mcp-shared` au lieu de dupliquer `utils.ts`
- Mettre a jour `package.json` (lint Biome, test memory cap)
- Ajouter `test:coverage` + `@vitest/coverage-v8` ou manquant
- Verifier qu'aucun comportement n'a regresse (1 251 tests doivent tous passer)

### Phase 3 — Hygiene complementaire (WARNING)

5. **TLS scope** dans mcp-obsidian (W1)
6. **fast-check + StrykerJS** sur tools critiques (W2)

### Phase 4 — Build mcp-playwright

Sur les fondations saines, construire le nouveau serveur en respectant directement le pattern corrige.

---

## Notes pour la prochaine session

- L'agent `Code Quality Master` a tourne 374s, 51 tool uses, 93K tokens — l'audit est exhaustif
- Le pattern reste fondamentalement bon : ces corrections ne sont **pas un rebuild**, c'est de l'hygiene transversale
- Apres correction : les 22 serveurs beneficient ensemble + mcp-playwright nait sur du propre
- Decision Jay (2026-04-26) : "On travaille sur des bases saines" — corrections AVANT mcp-playwright

**agentId pour reprendre l'audit si besoin** : `a0a61f1b18632c10a` (peut etre stale, agent expire avec la session)
