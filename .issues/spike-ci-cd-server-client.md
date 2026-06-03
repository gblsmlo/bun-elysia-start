# Spike: CI/CD for server and client

**Status:** pending
**Created:** 2026-06-03

## Context

This project is a boilerplate with two workspaces:

- `server/`: Bun + Elysia + Better Auth + Drizzle/PostgreSQL
- `client/`: TanStack Start + React

Today they live in one repository, but the intended future state is for
`server` and `client` to become separate repositories. CI/CD should therefore be
designed so each workspace can be validated and deployed independently.

## Spike goals

Evaluate and propose a CI/CD architecture that works now in the monorepo and can
be split cleanly later.

## Questions to answer

1. Should CI be implemented as separate workflow files per workspace from day
   one (`server-ci.yml`, `client-ci.yml`)?
2. Which validation commands should be required for each workspace?
3. How should shared boilerplate docs and templates be validated?
4. What deployment target should each workspace assume initially?
5. How should database migrations be handled in server deployment?
6. How should environment variables and secrets be represented for template
   users without committing real values?
7. What changes are needed so the future repo split is mostly file movement,
   not pipeline redesign?

## Expected deliverables

- Proposed GitHub Actions workflow layout.
- Required command matrix for `server` and `client`.
- Recommended branch/PR checks.
- Recommended release/deployment model for a boilerplate.
- Migration strategy for splitting into separate repositories.
- List of implementation tasks after the spike.

## Initial direction

- Keep server and client CI independent even while they are in the same repo.
- Use path filters so server changes do not force client-only checks, and vice
  versa, while still allowing full validation on shared/root changes.
- Prefer reusable workflow conventions that can be copied into separate repos.
- Make setup validation depend on the tooling task:
  `.issues/setup-validation-tooling.md`.

## Done when

- The team has an approved CI/CD design.
- Follow-up implementation tasks are created with clear acceptance criteria.
- The design explicitly covers both the current monorepo and the future
  separated-repo state.
