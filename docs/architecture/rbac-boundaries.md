# RBAC Boundaries

## Canonical Entity

`organization` is the canonical business entity that groups users.

`account` refers only to the Better Auth credential/provider table. Do not add
business-domain `account` or `accounts` tables.

## Source Of Truth

Better Auth owns the authentication and organization lifecycle:

- users
- sessions
- organizations
- members
- invitations

The server wires this through `server/src/infra/auth.ts` with the Better Auth
organization plugin. The client wires the matching browser plugin in
`client/src/shared/auth-client.ts`.

## Active Organization

The selected organization is stored on the Better Auth session as
`session.activeOrganizationId`.

Server code can also pass an explicit organization id to the authorization
helper when a route acts on a concrete organization resource. If no explicit id
is provided, the helper uses the active organization from the session.

## Authorization Enforcement

Server-side authorization is enforced in application code through
`server/src/app/middleware/organization-context.ts`.

Route handlers should call `resolveOrganizationContext(request, options)` before
accessing organization-scoped resources. The helper resolves:

- authenticated session
- authenticated user
- selected organization
- membership row
- application role

Handlers should not query membership ad hoc unless the route needs behavior not
covered by the helper.

## Starter Roles

The starter supports two application roles:

- `owner`
- `member`

`owner` is the creator role for new organizations. Richer permission models,
custom roles, teams, or policy engines are intentionally out of scope for the
boilerplate and should be added per project.

## Failure Model

The authorization helper returns explicit HTTP responses:

- `401 UNAUTHENTICATED` when no session exists.
- `400 NO_ACTIVE_ORGANIZATION` when no organization can be selected.
- `403 ORGANIZATION_MEMBERSHIP_REQUIRED` when the user is not a member.
- `403 UNSUPPORTED_ORGANIZATION_ROLE` when the stored role is outside the
  starter role set.
- `403 INSUFFICIENT_ORGANIZATION_ROLE` when the route requires a stronger role.
