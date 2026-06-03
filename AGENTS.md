# Repository Guidelines

## Project Structure & Module Organization

```
server/
  models/          # Domain entities and Drizzle schema definitions (PostgreSQL)
  infra/           # Database connections, external services, Better Auth config
  app/             # Elysia route handlers, middleware, business logic

client/
  features/        # Feature-based folders (each with components, hooks, api, types)
  shared/          # Shared components, utilities, and COSS UI configuration
```

**Server** follows a layered architecture: `models` (Drizzle schemas/types) → `infra` (database, auth, external integrations) → `app` (Elysia routes and application logic).

**Client** uses feature-folder architecture with TanStack Start. Each feature folder should be self-contained with its own components, hooks, API calls, and types.

## Build, Test, and Development Commands

- `bun install` — Install dependencies
- `bun dev` — Start development server (Bun + Elysia backend)
- `bun run build` — Production build
- `bun run db:generate` — Generate Drizzle migrations
- `bun run db:migrate` — Apply Drizzle migrations
- `bun run db:push` — Push schema changes directly (dev only)

## Coding Style & Naming Conventions

- **Language**: TypeScript (strict mode)
- **Indentation**: 2 spaces
- **Naming**: camelCase for variables/functions, PascalCase for components/types, kebab-case for file names
- **Validation**: Use Zod schemas for all input validation and type inference
- **Imports**: Prefer path aliases over relative paths when available
- **Components**: COSS UI components as the design system base

## Architecture Guidelines

- **Server routes**: Define with Elysia's router in `app/`. Keep handlers thin — delegate to service functions.
- **Auth**: Use Better Auth for all authentication flows. Auth config lives in `infra/`.
- **Database**: All schema definitions use Drizzle ORM in `models/`. Never write raw SQL unless absolutely necessary.
- **Client features**: Each feature folder contains everything related to that feature. Shared logic goes in `shared/`.
- **API communication**: Use TanStack Query for server state. Define API functions co-located within feature folders.

## Security & Configuration

- Never commit `.env` files. Use `.env.example` for reference.
- Store database credentials and auth secrets exclusively in environment variables.
- Validate all user input with Zod schemas on both client and server.
