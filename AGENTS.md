# Repository Guidelines

## Project Structure & Module Organization

```
server/
  src/
    models/        # Domain types (inferred from schema) and repository interfaces
    infra/         # DB connection + Drizzle schema (one file per table), Better Auth
    app/           # Elysia route handlers, middleware, business logic

client/
  src/
    routes/        # TanStack Start file-based routes (__root.tsx, index.tsx, ...)
    features/      # Feature-based folders (each with components, hooks, api, types)
    shared/        # Shared components, hooks, and utilities
```

**Server** follows a layered architecture: `infra/db/schema` (Drizzle tables, coupled to the adapter/migrations) → `models` (domain-facing types inferred via `$inferSelect` / `$inferInsert`, plus future repository interfaces) → `app` (Elysia routes and application logic). App and business code import types from `models/`, never directly from `infra/db/schema`.

**Client** uses feature-folder architecture with TanStack Start. Each feature folder should be self-contained with its own components, hooks, API calls, and types.

## Build, Test, and Development Commands

Run commands inside each workspace (`server/` or `client/`).

Server (`cd server`):
- `bun install` — Install dependencies
- `bun dev` — Start the Bun + Elysia backend (port 3000)
- `bun run db:generate` — Generate Drizzle migrations
- `bun run db:migrate` — Apply Drizzle migrations
- `bun run db:push` — Push schema changes directly (dev only)

Client (`cd client`):
- `bun install` — Install dependencies
- `bun dev` — Start the TanStack Start dev server (port 3001)
- `bun run build` — Production build

## Coding Style & Naming Conventions

- **Language**: TypeScript (strict mode)
- **Indentation**: 2 spaces
- **Naming**: camelCase for variables/functions, PascalCase for components/types, kebab-case for file names
- **Validation**: Use Zod schemas for all input validation and type inference
- **Imports**: Prefer path aliases over relative paths (server: `@models`, `@infra`, `@app`, `@lib`; client: `@features`, `@shared`, `@routes`)
- **UI**: No UI library yet — plain React components in the client

## Architecture Guidelines

- **Server routes**: Define with Elysia's router in `app/`. Keep handlers thin — delegate to service functions.
- **Auth**: Use Better Auth for all authentication flows. Auth config lives in `infra/`.
- **Database**: All schema definitions use Drizzle ORM in `infra/db/schema/`, one file per table with relations and indexes co-located and re-exported from `index.ts`. Domain types live in `models/`. Never write raw SQL unless absolutely necessary.
- **Client features**: Each feature folder contains everything related to that feature. Shared logic goes in `shared/`.
- **API communication**: Use TanStack Query for server state. Define API functions co-located within feature folders.

## Security & Configuration

- Never commit `.env` files. Use `.env.example` for reference.
- Store database credentials and auth secrets exclusively in environment variables.
- Validate all user input with Zod schemas on both client and server.
