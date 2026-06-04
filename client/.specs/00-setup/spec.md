# Spec 00 — Client Setup (TanStack Start + Bun)

## Summary

Establish a production-ready frontend toolchain for the `client/` workspace,
migrating five previously ad-hoc setup prompts into a single, repeatable spec.
The original prompts targeted Next.js App Router + pnpm; this spec adapts their
**intent** to the project's real stack: **TanStack Start + Vite 8 + React 19,
run with Bun**, using a Feature-Based Architecture (FBA).

## Why

- The client already exists as a TanStack Start app but has **no linting,
  formatting, testing, or commit-quality tooling**.
- `.issues/setup-validation-tooling.md` requires a consistent, repeatable
  validation toolchain (Biome, Husky, commitlint, typecheck/build) across
  workspaces.
- The five prompts encode that toolchain but for the wrong stack/package
  manager. Codifying them as a spec makes the setup reproducible and reviewable
  instead of copy-pasted prompt-by-prompt.

## Stack of record (source of truth)

| Concern | Value |
| --- | --- |
| Framework | TanStack Start (`@tanstack/react-start`, `@tanstack/react-router`) |
| Bundler / dev server | Vite 8 (`vite dev` on port 3001) |
| UI runtime | React 19 + React DOM 19 |
| Package manager | **Bun** (`bun add`, `bun add -d`, `bunx`) |
| Validation | Zod, via `import.meta.env` (VITE_ prefix) |
| Auth | Better Auth browser client (organization plugin) |
| Path aliases | `@features/*`, `@shared/*`, `@routes/*` |

## Scope

In scope (the five phases):

1. **Foundation** — confirm/harden the TanStack Start app, lock path aliases,
   zod env validation, React Compiler, `React.StrictMode`.
2. **Biome** — sole linter/formatter/import-organizer, FBA-tuned.
3. **Vitest** — unit/integration testing with Testing Library + happy-dom, plus
   Playwright wiring for e2e.
4. **Git hooks** — Husky + lint-staged + commitlint + cz-git, installed at the
   **repo root** (monorepo `.git`), routed to the client workspace.
5. **FBA structure** — directories, barrels, and import rules using the
   project's `@features/@shared/@routes` scheme.

Out of scope:

- Rebuilding the client as Next.js or switching to pnpm.
- Server (`server/`) tooling (tracked separately in
  `.issues/setup-validation-tooling.md`).
- Adding a UI library or any feature implementation.
- Creating CI pipelines (only local hooks + CI-ready scripts).

## Non-negotiable constraints

- **Package manager:** Bun only — never npm, yarn, or pnpm.
- **Versions:** always `@latest` — never pin version numbers.
- **Aliases:** use the existing FBA aliases `@features`, `@shared`, `@routes`.
  Never introduce `@/*`, `@components`, `@lib`, `@hooks`, or `@types`.
- **Naming:** strict kebab-case for all files and directories — never
  PascalCase filenames.
- **Barrel files:** `index.ts` contains only export statements — no logic or
  side effects.
- **Tooling exclusivity:** Biome is the only lint/format tool; no ESLint or
  Prettier may coexist.
- **On failure:** stop immediately, report the exact error, suggest a fix, and
  do not continue to the next phase.
- **tsconfig is the source of truth** for alias names; read it before mirroring
  aliases into any other config.

## Requirements & acceptance criteria

### R1 — Foundation
- `tsconfig.json` exposes exactly `@features/*`, `@shared/*`, `@routes/*` with
  `target: ES2022`. `baseUrl` is intentionally omitted: it is deprecated in the
  project's TypeScript 6 and `paths` resolve relative to `tsconfig.json`.
- Client env is validated with zod from `import.meta.env` (VITE_ prefix) and
  exported from `src/shared/env.ts`.
- React Compiler is enabled via `babel-plugin-react-compiler`. Because
  `@vitejs/plugin-react` v6 is oxc-based and has no `babel` option, the compiler
  runs through a `vite-plugin-babel` pass with `enforce: "pre"` (so it sees JSX
  before oxc), scoped to `src` and excluding `node_modules`.
- The app root renders inside `React.StrictMode`.
- **Accept:** `bun dev` starts with no errors; `bunx tsc --noEmit` passes.

### R2 — Biome
- `@biomejs/biome` installed (dev); no ESLint/Prettier packages or config files
  exist.
- `biome.json` enforces: tabs, indent width 2, line width 100, LF, single
  quotes, no semicolons, trailing commas all; `noUnusedImports` = error,
  `noExplicitAny` = warn, recommended = true, organize-imports on; includes only
  `*.{ts,tsx,js,jsx,cjs,mjs,json}`, excludes `node_modules`, `dist`, `.tanstack`,
  `.output`, `src/routeTree.gen.ts`.
- Scripts present: `lint`, `lint:format`, `lint:ci`, `lint:staged`,
  `lint:unsafe`.
- `.vscode/settings.json` sets Biome as default formatter + format/organize on
  save; `.vscode/extensions.json` recommends `biomejs.biome` and unwants
  ESLint/Prettier.
- **Accept:** `bun lint` exits with 0 errors.

### R3 — Vitest
- Test deps installed (dev): `vitest`, `@vitejs/plugin-react`,
  `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`,
  `happy-dom`, `jsdom`, `@playwright/test`.
- `vitest.config.ts` uses `happy-dom`, globals on, `setupFiles`, and
  `resolve.alias` that **exactly mirrors** tsconfig (`@features`, `@shared`,
  `@routes`).
- `vitest.setup.ts` imports `@testing-library/jest-dom`.
- Full test script matrix added (see plan); naming convention: `.spec` = unit
  (parallel), `.test` = integration (sequential), `.e2e` = Playwright.
- `src/example.test.ts` smoke test validates assertions + jest-dom matchers.
- **Accept:** `bun run test` passes with ≥ 2 tests and no "Cannot find module"
  alias errors.

### R4 — Git hooks (monorepo)
- Husky, lint-staged, `@commitlint/cli`, `@commitlint/config-conventional`,
  `@commitlint/types`, cz-git, czg installed at the **repo root**.
- `.husky/pre-commit` runs staged lint for the client; `.husky/commit-msg` runs
  commitlint; both executable.
- `commitlint.config.ts` extends conventional config and defines a cz-git prompt
  with 11 types (feat, fix, docs, style, refactor, perf, test, build, ci, chore,
  revert), each with description + emoji.
- Root `package.json` has `prepare: husky`, `commit: czg`, commitizen path/emoji
  config, and a `lint-staged` mapping that routes client files to
  `cd client && bun lint:staged`.
- **Accept:** `echo "feat: add client tooling" | bunx commitlint --config
  commitlint.config.ts` exits 0.

### R5 — FBA structure
- Directory tree under `client/src`: `features/<name>/{api,components,hooks,
  types,utils}`, `shared/{components,hooks,utils,lib,types}`, `routes/`.
- Barrel `index.ts` for each top-level FBA directory; export-only; commented
  placeholders for not-yet-existing implementations.
- Import rules documented in barrels: internal → relative; cross-feature →
  `@features` barrel; shared → `@shared`; never deep-import across features;
  `export type` for type-only exports.
- Existing `features/auth`, `features/dashboard`, `features/home`, and `shared/`
  are reconciled into this structure (no PascalCase dirs).
- **Accept:** `bun lint` passes with 0 errors; no PascalCase directory names;
  no barrel contains non-export statements.

## Overall success criteria

- `bunx tsc --noEmit`, `bun lint`, and `bun run test` all pass in `client/`.
- A commit triggers Biome on staged client files and commitlint on the message.
- The `src/` tree follows FBA conventions with working barrels and aliases.

## References

- `.issues/setup-validation-tooling.md` — toolchain requirements.
- `docs/architecture/bootstrap-plan.md` — client scaffold direction.
- `AGENTS.md` — repository conventions and alias scheme.
