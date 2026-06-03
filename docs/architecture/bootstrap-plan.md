# Bootstrap Architecture Plan

## Objective

Build a starter/fullstack foundation for new projects that will use authentication,
organizations/accounts/users, and RBAC, while keeping responsibilities separated
and avoiding decisions that depend on production topology too early.

The starter should make new project setup low effort, but still leave room to
grow without rewriting the base.

## What Exists Today

### Server

- `server/src/app/http/server.ts` boots Elysia, wires CORS, and mounts Better Auth.
- `server/src/infra/auth.ts` configures Better Auth and the Drizzle adapter.
- `server/src/infra/db/` contains the database connection, migrations, seed, and
  schema definitions.
- `server/src/env.ts` already validates runtime environment variables.
- Current schema has Better Auth tables plus one business table in
  `server/src/infra/db/schema/account.ts`.

### Client

- `client/src/routes/` contains direct page routes for home, login, signup, and
  dashboard.
- `client/src/shared/auth-client.ts` wraps the Better Auth browser client.
- `client/src/features/` and `client/src/shared/` exist as placeholders, but the
  app is still route-first rather than feature-structured.

## Architectural Principles

1. Keep infrastructure concerns in `infra/`.
2. Layer the data definitions explicitly:
   - **Drizzle table definitions** live in `infra/db/schema/` because they are
     coupled to the Drizzle adapter, Better Auth, and the migration pipeline.
   - **`models/`** holds domain-facing types (inferred from the schema via
     `InferSelect` / `InferInsert`), domain entities, and repository interfaces
     once/if the repository pattern is adopted.
   - App and business code import types from `models/`, never directly from the
     infra schema, so the domain layer stays decoupled from persistence details.
3. Keep HTTP and route handlers thin in `app/`.
4. Prefer one canonical term for the business entity that groups users.
5. Do not hard-code production assumptions about auth/cookies/CORS until the
   frontend deployment topology is known.
6. Add complexity only when the starter needs it.

## Key Observations

- There is a confirmed naming collision: `infra/db/schema/auth.ts` exports the
  Better Auth `account` table while `infra/db/schema/account.ts` exports the
  business `accounts` table. The file name `account.ts` holding `accounts` makes
  this worse.
- All Better Auth tables (`user`, `session`, `account`, `verification`) currently
  share a single `auth.ts` file, which hides the collision and makes the schema
  harder to navigate as it grows.
- `models/` exists but is empty; AGENTS.md still describes it as the home for
  Drizzle schema, which conflicts with the actual `infra/db/schema/` layout and
  must be reconciled.
- The server already has the right layer split, but the bootstrap code still mixes
  startup concerns with request handling details.
- The client works, but it is not yet organized as a reusable feature scaffold.
- Route-level auth exists only as a page concern on the client; there is no shared
  guard model yet.
- The current setup is good for a single product demo, but not yet a polished
  starter for multiple future projects.

## Workstreams

### 1. Server Foundation

Goal: make the backend a reusable starter without leaking decisions into route
handlers.

Tasks:

1. Centralize all runtime config in `server/src/env.ts`.
   - Import the validated `env` everywhere; remove the duplicated `clientURL` /
     `baseURL` default literals from `infra/auth.ts` and `app/http/server.ts`.
2. Remove direct `process.env` usage from app/bootstrap code (single source of
   truth = `env.ts`).
3. Keep auth wiring in `infra/auth.ts` and HTTP wiring in `app/http/server.ts`.
4. Split the DB schema into one file per table under `infra/db/schema/`:
   - `user.ts`, `session.ts`, `account.ts`, `verification.ts` for Better Auth.
   - Re-export everything from `infra/db/schema/index.ts`.
   - Keep each table's relations and indexes co-located in its own file.
5. Resolve the `account` naming collision by removing the hand-rolled business
   `accounts` table in favor of the Better Auth organization plugin (see
   Workstream 2). The word `account` then unambiguously means the Better Auth
   credential table.
6. Establish `models/` as the domain types layer:
   - Export inferred types (`InferSelect` / `InferInsert`) from the schema.
   - Reserve space for repository interfaces if/when that pattern is adopted.
   - Update AGENTS.md so the documented `models/` vs `infra/db/schema/` split
     matches reality.

### 2. RBAC Domain Foundation

Goal: establish the minimum domain model for organizations and access control by
reusing Better Auth's official `organization` plugin instead of hand-rolling the
domain.

Decision: adopt the Better Auth **organization plugin**. It provides
organizations, membership, roles, and invitations out of the box, directly
covering the membership model, the RBAC base, and the invitation decision gate,
while staying consistent with the existing Better Auth stack.

Tasks:

1. Enable the `organization` plugin in `infra/auth.ts` and add the matching
   client plugin in `client/src/shared/auth-client.ts`.
2. Generate / wire the plugin schema (`organization`, `member`, `invitation`)
   into `infra/db/schema/` following the one-file-per-table convention, and run a
   migration.
3. Adopt `organization` as the canonical business entity term project-wide.
4. Keep roles minimal at first — rely on the plugin's default `owner` / `member`
   roles and add custom roles/permissions only when a project needs them.
5. Add a server-side enforcement point: a helper/middleware that resolves the
   active session + organization + role into the request context, so route
   handlers have a single, consistent place to authorize.
6. Capture the RBAC boundaries (where authorization is enforced, how the active
   org is selected) in docs before adding richer policy machinery.

Notes:

- Do not assume permission inheritance, custom policy engines, or hierarchical
  teams unless the project needs them.
- Prefer the plugin's built-in access-control primitives over a bespoke engine.
- Start with the smallest useful access model and grow from there.

### 3. Client Scaffold

Goal: make the TanStack Start app reusable for future projects with minimal setup.

Tasks:

1. Move shared auth/browser logic into a feature boundary instead of keeping it
   only in route files.
2. Add a basic app shell/layout route that can be reused across protected and
   public pages.
3. Organize auth pages and protected pages into feature folders where it makes
   sense.
4. Keep route files thin and make them compose feature components.

### 4. Setup and Verification

Goal: make the starter easy to validate for every new project.

Tasks:

1. Keep the existing auth integration test as the primary backend signal.
2. Add client-side build/typecheck verification to the setup docs.
3. Maintain a concise setup guide for env vars, migrations, and local dev.
4. Document the minimal bootstrap steps needed for a new project.

## Decision Gates

These decisions should be resolved before implementing broader RBAC behavior:

1. Production frontend topology (OPEN):
   - same origin
   - subdomain split
   - or cross-site
2. Canonical business entity name (RESOLVED):
   - `organization`, provided by the Better Auth organization plugin; the
     hand-rolled business `accounts` table is removed.
3. RBAC scope (RESOLVED for the starter):
   - start with the plugin's default role-based access (`owner` / `member`);
     extend to custom role + permission only per-project.
4. Invitation flow (RESOLVED):
   - covered by the organization plugin's invitation support; available now,
     adopted incrementally.

## Suggested Delivery Order

1. Normalize server config and layer boundaries (env single source of truth).
2. Split the schema into one file per table and stand up the `models/` types
   layer.
3. Remove the business `accounts` table and enable the Better Auth organization
   plugin (organization/member/invitation) plus server-side enforcement.
4. Refactor the client into a reusable feature layout.
5. Tighten setup docs and verification steps.
6. Only then expand into richer RBAC behavior.

## Out of Scope For The Starter

- Microservices
- Event-driven architecture
- Custom policy engines
- Multi-tenant sharding
- Over-abstracted repository layers for simple CRUD

## Revisit Triggers

- When the first production deployment topology is known.
- When access control needs more than a simple role model.
- When the starter begins to accumulate repeated per-project setup steps.
- When domain naming becomes confusing between auth and business concepts.

