# Setup validation tooling

**Status:** pending
**Created:** 2026-06-03

## Context

The project is a boilerplate with two workspaces (`server/` and `client/`), but
the setup validation is not consistent yet. During issue #2 work, server
validation exposed build and type-check failures that should be handled as a
dedicated setup task instead of being mixed with runtime config work.

## Known failures

### Server type-check

Command:

```bash
cd server
bunx tsc --noEmit
```

Current failures:

- `server/tests/auth.integration.test.ts`: mocked `fetch` is missing the
  `preconnect` property required by Bun's `typeof fetch`.
- `server/tests/auth.integration.test.ts`: Elysia app type mismatch in the test
  helper/type annotation.

### Server build

Command:

```bash
cd server
bun run build
```

Current failure:

- `bun build src/app/http/server.ts --outdir dist` defaults to a browser target
  and fails on Node/Bun built-ins used by `postgres` (`tls`, `perf_hooks`).

Additional build check:

```bash
cd server
bun build src/app/http/server.ts --outdir /tmp/bun-elysia-start-server-build --target bun
```

Current failure:

- `@better-auth/kysely-adapter` imports `DEFAULT_MIGRATION_LOCK_TABLE` and
  `DEFAULT_MIGRATION_TABLE` from `kysely`, but the installed `kysely` export set
  does not provide them.

### Lint

There is no agreed lint/format command yet for either workspace.

## Task

Implement a repeatable setup validation toolchain.

1. Add Biome as the formatter/linter for both `server/` and `client/`.
2. Add scripts in each workspace:
   ```json
   {
     "format": "biome format --write .",
     "lint": "biome check .",
     "typecheck": "tsc --noEmit"
   }
   ```
3. Add a root-level validation script or documented command that runs both
   workspace validations.
4. Add Husky hooks for local quality gates.
5. Add commitlint with Conventional Commits.
6. Fix the known server `typecheck` and `build` failures or document any
   dependency constraints that block them.
7. Add/update docs so contributors know which commands validate the boilerplate.

## Done when

- `server` has working `lint`, `format`, `typecheck`, and `build` commands.
- `client` has working `lint`, `format`, `typecheck`, and `build` commands.
- Husky runs a minimal pre-commit validation.
- commitlint validates commit messages.
- The known `tsc`, lint, and build failures are resolved or tracked with precise
  upstream/dependency blockers.
