# Tasks 00 — Client Setup (TanStack Start + Bun)

Ordered checklist. Execute phases in order; each ends with a verification gate
that must pass before moving on. Commands run from `client/` unless marked
**(repo root)**. Stop on first error and report it.

## Phase 1 — Foundation

- [x] 1.1 Confirm the app is TanStack Start + Vite + React 19 (`package.json`).
- [x] 1.2 In `tsconfig.json`, set `target: "ES2022"` and keep `paths` =
      `@features/*`, `@shared/*`, `@routes/*` only. Omit `baseUrl` (deprecated in
      TS6; paths resolve relative to tsconfig).
- [x] 1.3 Install missing deps: `bun add zod` (already present) and
      `bun add -d babel-plugin-react-compiler vite-plugin-babel @babel/core
      @babel/preset-typescript`.
- [x] 1.4 Enable React Compiler in `vite.config.ts` via a `vite-plugin-babel`
      `pre` pass (plugin order: `tanstackStart()`, `reactCompiler`,
      `viteReact()`), scoped to `src`, excluding `node_modules`.
- [x] 1.5 Ensure `src/shared/env.ts` validates env with zod + `import.meta.env`
      (VITE_ prefix); `.env.example` already in sync.
- [x] 1.6 Wrap the app root in `<React.StrictMode>`.
- [x] **Gate 1:** `bunx tsc --noEmit` passes; `bun dev` boots (HTTP 200) with no
      warnings; compiler output verified (`const $ = _c(N)`).

## Phase 2 — Biome

- [ ] 2.1 Assert no ESLint/Prettier packages or config files exist; remove any
      found.
- [ ] 2.2 `bun add -d @biomejs/biome`.
- [ ] 2.3 `bunx biome init`, then set `$schema` to the installed version.
- [ ] 2.4 Overwrite `biome.json` with the FBA-tuned config (tabs, width 2, line
      100, lf, single quotes, no semicolons, trailing all; `noUnusedImports`
      error, `noExplicitAny` warn, recommended on, organizeImports on; includes
      only `*.{ts,tsx,js,jsx,cjs,mjs,json}`; excludes `node_modules`, `dist`,
      `.tanstack`, `.output`, `src/routeTree.gen.ts`).
- [ ] 2.5 Add scripts: `lint`, `lint:format`, `lint:ci`, `lint:staged`,
      `lint:unsafe`.
- [ ] 2.6 Create `.vscode/settings.json` (Biome default formatter + format &
      organize on save) and `.vscode/extensions.json` (recommend Biome, unwant
      ESLint/Prettier).
- [ ] **Gate 2:** `bun lint` exits with 0 errors.

## Phase 3 — Vitest

- [ ] 3.1 Read `tsconfig.json` paths (source of truth for aliases).
- [ ] 3.2 Install: `bun add -d vitest @vitejs/plugin-react
      @testing-library/react @testing-library/dom @testing-library/jest-dom
      happy-dom jsdom @playwright/test`.
- [ ] 3.3 Create `vitest.config.ts` (happy-dom, globals, setupFiles, react
      plugin) with `resolve.alias` mirroring `@features/@shared/@routes`.
- [ ] 3.4 Create `vitest.setup.ts` → `import '@testing-library/jest-dom'`.
- [ ] 3.5 Add the full test script matrix to `package.json`.
- [ ] 3.6 Create `src/example.test.ts` (one plain assertion + one jest-dom
      matcher).
- [ ] **Gate 3:** `bun run test` passes with ≥ 2 tests and no alias
      "Cannot find module" errors. (`test:e2e` optional locally; needs
      `bunx playwright install`.)

## Phase 4 — Git hooks (repo root)

- [ ] 4.1 Verify `.git/` exists at the repo root; do not run `git init`.
- [ ] 4.2 **(root)** Ensure a private root `package.json` exists to host hooks;
      create a minimal one if absent (no workspace conversion).
- [ ] 4.3 **(root)** `bun add -d husky lint-staged @commitlint/cli
      @commitlint/config-conventional @commitlint/types cz-git czg`.
- [ ] 4.4 **(root)** `bunx husky init`; overwrite `.husky/pre-commit` to run
      `bunx lint-staged`.
- [ ] 4.5 **(root)** Create `.husky/commit-msg` →
      `bunx --no -- commitlint --edit "$1"`; `chmod +x` both hooks.
- [ ] 4.6 **(root)** Create `commitlint.config.ts` (conventional + 100-char
      limits + cz-git prompt with 11 types & emojis).
- [ ] 4.7 **(root)** Merge into root `package.json`: `prepare: husky`,
      `commit: czg`, commitizen config, and `lint-staged` routing
      `client/**/*.{ts,tsx,js,jsx,json}` → `cd client && bun lint:staged`.
- [ ] **Gate 4:** `echo "feat: add client tooling" | bunx commitlint --config
      commitlint.config.ts` exits 0.

## Phase 5 — FBA structure

- [ ] 5.1 Read `tsconfig.json` to confirm alias names.
- [ ] 5.2 Create dirs with explicit `mkdir -p` (no brace expansion):
      `features/{auth,account}/{api,components,hooks,types,utils}` and
      `shared/{components,hooks,utils,lib,types}`.
- [ ] 5.3 Reconcile existing `features/auth`, `features/dashboard`,
      `features/home`, `shared/` into the layout; keep kebab-case.
- [ ] 5.4 Add export-only barrel `index.ts` to each top-level FBA directory with
      commented placeholders where implementations don't exist yet.
- [ ] 5.5 Document import rules as comments in each barrel (internal=relative,
      cross-feature=`@features`, shared=`@shared`, no deep imports,
      `export type` for types).
- [ ] 5.6 `find src -type d | sort` and `find src -name index.ts | sort` to
      verify the tree and barrels.
- [ ] **Gate 5:** `bun lint` passes with 0 errors; no PascalCase dirs; no
      barrel contains non-export statements.

## Final verification

- [ ] F.1 `cd client && bunx tsc --noEmit` passes.
- [ ] F.2 `cd client && bun lint` passes.
- [ ] F.3 `cd client && bun run test` passes.
- [ ] F.4 A commit triggers Biome on staged client files + commitlint on the
      message.
- [ ] F.5 Spec acceptance criteria R1–R5 all satisfied.
