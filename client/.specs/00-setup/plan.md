# Plan 00 — Client Setup (TanStack Start + Bun)

Technical approach for each phase. All commands run from `client/` unless noted
as **(repo root)**. Always install with Bun and `@latest`. Stop on first error.

---

## Mapping: original prompts → this stack

| Original (Next.js + pnpm) | Adapted (TanStack Start + Bun) |
| --- | --- |
| `pnpm create next-app` | App already scaffolded — verify, do not recreate |
| `pnpm add ...` / `pnpm add -D ...` | `bun add ...` / `bun add -d ...` |
| `@t3-oss/env-nextjs` | zod + `import.meta.env` (already in `shared/env.ts`) |
| `next.config.* reactStrictMode` | `<React.StrictMode>` in the root component |
| `babel-plugin-react-compiler` (Next) | same plugin via `@vitejs/plugin-react` babel |
| aliases `@components/@lib/@hooks/@types` | `@features` / `@shared` / `@routes` |
| `components/ ` `lib/` `hooks/` `types/` | consolidated under `shared/` |
| `npx commitlint` | `bunx commitlint` |
| `pnpm exec husky init` | `bunx husky init` **(repo root)** |

---

## Phase 1 — Foundation

The TanStack Start app exists; this phase confirms and hardens it.

Dependencies (only if missing):

```bash
bun add zod
bun add -d babel-plugin-react-compiler vite-plugin-babel @babel/core @babel/preset-typescript
```

`tsconfig.json` — keep the project alias scheme and `target: ES2022`. Do **not**
add `baseUrl`: it is deprecated in TypeScript 6 (`bunx tsc` errors with TS5101)
and `paths` already resolve relative to `tsconfig.json`.

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "paths": {
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"],
      "@routes/*": ["./src/routes/*"]
    }
  }
}
```

`vite.config.ts` — `@vitejs/plugin-react` v6 is oxc-based and dropped the
`babel` option, so wire the React Compiler through `vite-plugin-babel` as a
`pre` pass (runs before oxc transforms JSX), scoped to `src`:

```ts
import babel from "vite-plugin-babel"

const reactCompiler = {
  ...babel({
    include: /\.[jt]sx?$/,
    exclude: /node_modules/,
    babelConfig: {
      babelrc: false,
      configFile: false,
      presets: ["@babel/preset-typescript"],
      plugins: [["babel-plugin-react-compiler", {}]],
    },
  }),
  enforce: "pre" as const,
}

// plugins order: tanstackStart(), reactCompiler, viteReact()
```

Verify the compiler runs: the transformed output of a component contains the
memo-cache call `const $ = _c(N)`.

Env validation already follows the target pattern in `src/shared/env.ts`
(zod + `import.meta.env`, VITE_ prefix). Extend the schema here as new VITE_
vars are introduced; keep `.env.example` in sync.

`React.StrictMode` — ensure the root (`src/routes/__root.tsx` shell or the
client entry) wraps the app tree in `<React.StrictMode>`.

Verify: `bunx tsc --noEmit` and `bun dev` start cleanly.

---

## Phase 2 — Biome

```bash
bun add -d @biomejs/biome
bunx biome init           # then align $schema URL to the installed version
```

There is currently no ESLint/Prettier in `client/`; assert none exists
(`eslint.config.*`, `.eslintrc.*`, `.prettierrc.*`, `.editorconfig`,
`.eslintignore`, `.prettierignore`). If a future ESLint/Prettier creeps in,
remove the packages and files before proceeding.

`biome.json` (shape depends on installed major; adapt `$schema`):

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/<installed-version>/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "asNeeded", "trailingCommas": "all" }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedImports": "error" },
      "suspicious": { "noExplicitAny": "warn" }
    }
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "files": {
    "includes": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.cjs", "**/*.mjs", "**/*.json",
      "!**/node_modules", "!**/dist", "!**/.tanstack", "!**/.output", "!src/routeTree.gen.ts"]
  }
}
```

`package.json` scripts (merge, do not remove dev/build/start):

```jsonc
{
  "scripts": {
    "lint": "biome check --write .",
    "lint:format": "biome format --write .",
    "lint:ci": "biome ci .",
    "lint:staged": "biome check --staged --write .",
    "lint:unsafe": "biome check --unsafe --write ."
  }
}
```

`.vscode/settings.json`: Biome as `editor.defaultFormatter`
(`biomejs.biome`), `editor.formatOnSave: true`, organize imports on save.
`.vscode/extensions.json`: recommend `biomejs.biome`; add ESLint/Prettier to
`unwantedRecommendations`.

Verify: `bun lint` → 0 errors. Use `bun run lint:unsafe` only for auto-fixable
infos (e.g. `node:` protocol).

---

## Phase 3 — Vitest

```bash
bun add -d vitest @vitejs/plugin-react @testing-library/react \
  @testing-library/dom @testing-library/jest-dom happy-dom jsdom @playwright/test
```

Read `tsconfig.json` first; aliases in `vitest.config.ts` must match exactly
(strip the `/*`):

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@features': resolve(__dirname, './src/features'),
      '@shared': resolve(__dirname, './src/shared'),
      '@routes': resolve(__dirname, './src/routes'),
    },
  },
})
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom'
```

`package.json` test scripts (replace any existing test script):

```jsonc
{
  "scripts": {
    "test": "vitest run --bail 1",
    "test:all": "bun run test && bun run test:e2e",
    "test:watch": "vitest --bail 1",
    "test:unit": "vitest run --exclude 'src/**/*.{test,e2e}.{ts,tsx}' --fileParallelism",
    "test:unit:watch": "vitest --exclude 'src/**/*.{test,e2e}.{ts,tsx}' --fileParallelism",
    "test:int": "vitest run --exclude 'src/**/*.{spec,e2e}.{ts,tsx}' --no-file-parallelism",
    "test:int:watch": "vitest --exclude 'src/**/*.{spec,e2e}.{ts,tsx}' --no-file-parallelism",
    "test:cov": "vitest run --coverage --no-file-parallelism",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report"
  }
}
```

Naming convention: `.spec.ts(x)` = unit (parallel), `.test.ts(x)` =
integration (sequential), `.e2e.ts(x)` = Playwright (sequential).

`src/example.test.ts` smoke test: one plain assertion + one jest-dom matcher
(e.g. `toHaveClass`) to confirm `vitest.setup.ts` loads.

Verify: `bun run test` passes (≥ 2 tests). `bun run test:e2e` requires
Playwright browsers (`bunx playwright install`) and a running app — keep e2e
optional locally; CI installs browsers.

---

## Phase 4 — Git hooks (monorepo-aware)

**Important:** `.git` lives at the **repo root**, not in `client/`. Husky must
be initialized once at the root and route work into each workspace.

**(repo root)**

```bash
bun add -d husky lint-staged @commitlint/cli @commitlint/config-conventional \
  @commitlint/types cz-git czg
bunx husky init        # creates .husky/ and adds "prepare": "husky"
```

`.husky/pre-commit` (overwrite the default):

```sh
#!/bin/sh
if ! bunx lint-staged; then
  echo "Pre-commit checks failed. Run 'cd client && bun lint' to fix."
  exit 1
fi
echo "Pre-commit checks passed"
```

`.husky/commit-msg`:

```sh
#!/bin/sh
bunx --no -- commitlint --edit "$1"
```

Make both executable: `chmod +x .husky/pre-commit .husky/commit-msg`.

`commitlint.config.ts` **(repo root)** — TypeScript config importing
`RuleConfigSeverity` from `@commitlint/types`, `extends`
`@commitlint/config-conventional`, 100-char limits, and a full cz-git
`prompt.questions` block with all 11 types and emojis:

| Type | Emoji | Type | Emoji |
| --- | --- | --- | --- |
| feat | ✨ | perf | 🚀 |
| fix | 🐛 | test | 🚨 |
| docs | 📚 | build | 🛠 |
| style | 💎 | ci | ⚙️ |
| refactor | 📦 | chore | ♻️ |
| revert | 🗑 | | |

Root `package.json` (merge, keep existing fields):

```jsonc
{
  "scripts": { "prepare": "husky", "commit": "czg" },
  "config": { "commitizen": { "path": "node_modules/cz-git", "useEmoji": true } },
  "lint-staged": { "client/**/*.{ts,tsx,js,jsx,json}": ["cd client && bun lint:staged"] }
}
```

> Note: a root `package.json` may not exist yet. If absent, create a minimal
> private root manifest solely to host hooks/commitlint/lint-staged; do not
> convert the repo into a Bun workspace as part of this spec.

Verify: `echo "feat: add client tooling" | bunx commitlint --config
commitlint.config.ts` exits 0. Do not run an interactive test commit. An empty
lint-staged list exiting non-zero when nothing is staged is expected.

---

## Phase 5 — FBA structure

Read `tsconfig.json` to confirm `@features`, `@shared`, `@routes` before
creating anything. Use explicit `mkdir -p` per directory (no brace expansion).

Target tree under `client/src`:

```
features/
  auth/      { api, components, hooks, types, utils }
  account/   { api, components, hooks, types, utils }
shared/
  components/
  hooks/
  utils/
  lib/
  types/
routes/      (TanStack file-based routes; already present)
```

Reconcile existing folders (`features/auth`, `features/dashboard`,
`features/home`, `shared/`) into this layout. Keep all names kebab-case.

Barrel `index.ts` (export-only) for each top-level FBA directory:
`features/<name>/index.ts`, `shared/components/index.ts`,
`shared/hooks/index.ts`, `shared/lib/index.ts`, `shared/types/index.ts`,
`shared/utils/index.ts`. For not-yet-existing implementations, use commented
placeholders (active exports to missing files break lint/build).

Import rules (document as comments at the top of each barrel):

```ts
// Internal (within a feature):   import { useAuth } from '../hooks/use-auth'   // relative
// Cross-feature:                 import { useAuth } from '@features/auth'      // barrel alias
// Shared:                        import { Button } from '@shared/components'   // barrel alias
// Forbidden (deep import):       import { useAuth } from '@features/auth/hooks/use-auth'
// Type-only:                     export type { AuthState } from './types/auth-types'
```

Verify: `find src -type d | sort`, `find src -name index.ts | sort`, then
`bun lint` → 0 errors (apply `bun run lint:unsafe` for auto-fixable infos).

---

## Files created or modified (summary)

| Phase | Files |
| --- | --- |
| 1 | `tsconfig.json`, `vite.config.ts`, `src/shared/env.ts`, root component, `.env.example` |
| 2 | `biome.json`, `package.json`, `.vscode/settings.json`, `.vscode/extensions.json` |
| 3 | `vitest.config.ts`, `vitest.setup.ts`, `src/example.test.ts`, `package.json` |
| 4 | **(root)** `.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.ts`, `package.json` |
| 5 | `src/features/*`, `src/shared/*` dirs + barrel `index.ts` files |
