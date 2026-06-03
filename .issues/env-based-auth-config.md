# Environment-based Better Auth config (dev vs production)

**Status:** pending — blocked on frontend serving decision
**Created:** 2026-06-02

## Context

The current Better Auth setup needs a cross-origin workaround (CORS plugin +
`trustedOrigins` + cross-origin cookie) **only** because, in development, the
client (`localhost:3001`) and the server (`localhost:3000`) run on different
origins. This workaround should not be hard-coded for production — it should be
driven by environment variables so each environment gets the right cookie/CORS
behavior.

## Blocker

We have not decided **how the frontend will be served in production**. The right
config depends on the topology:

- **A — Same origin (recommended):** reverse proxy serves the SPA at
  `https://app.com/` and proxies `https://app.com/api/auth/*` to Elysia.
  Cookies are first-party (`SameSite=Lax`, `Secure`); **no CORS, no
  `crossSubDomainCookies` needed** — the workaround simply isn't activated.
- **B — Subdomains:** `app.example.com` + `api.example.com`. Same-site, so
  `SameSite=Lax` still works, but needs `advanced.crossSubDomainCookies` with
  `domain: ".example.com"` and credentialed CORS.
- **C — Different sites:** entirely different domains → cross-site → needs
  `advanced.defaultCookieAttributes: { sameSite: "none", secure: true,
  partitioned: true }` and credentialed CORS.

## Task (once topology is chosen)

Make the auth config environment-driven instead of hard-coded.

1. `server/src/env.ts` — add:
   ```ts
   NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
   TRUSTED_ORIGINS: z.string().default("http://localhost:3001"), // CSV
   COOKIE_DOMAIN: z.string().optional(),        // e.g. ".example.com" (topology B)
   CROSS_SITE: z.coerce.boolean().default(false), // topology C
   ```

2. `server/src/infra/auth.ts` — add an `advanced` block:
   ```ts
   const isProd = env.NODE_ENV === "production";
   advanced: {
     useSecureCookies: isProd, // http in dev would break Secure cookies
     crossSubDomainCookies: env.COOKIE_DOMAIN
       ? { enabled: true, domain: env.COOKIE_DOMAIN }
       : undefined,
     defaultCookieAttributes: env.CROSS_SITE
       ? { sameSite: "none", secure: true, partitioned: true }
       : undefined,
   }
   ```
   And read `trustedOrigins` from `env.TRUSTED_ORIGINS.split(",")`.

3. `server/src/app/http/server.ts` — read CORS `origin` from
   `env.TRUSTED_ORIGINS.split(",")` (or drop CORS entirely for topology A).

4. Client — use Vite mode env files:
   - `client/.env` (dev): `VITE_SERVER_URL=http://localhost:3000`
   - `client/.env.production`: `VITE_SERVER_URL=https://api.example.com`
     (or empty for topology A)
   - `auth-client.ts`: `baseURL: import.meta.env.VITE_SERVER_URL || undefined`
     (empty = same origin as the browser).

## Behavior matrix

|                          | dev          | prod A (same origin) | prod B (subdomain) | prod C (cross-site) |
|--------------------------|--------------|----------------------|--------------------|---------------------|
| CORS                     | yes (`:3001`)| no                   | yes                | yes                 |
| `useSecureCookies`       | false        | true                 | true               | true                |
| `SameSite`               | Lax          | Lax                  | Lax                | None                |
| `crossSubDomainCookies`  | —            | —                    | `.example.com`     | —                   |

## Notes

- Verified against `better-auth@1.6.14`: option names are
  `advanced.useSecureCookies`, `advanced.crossSubDomainCookies.{enabled,domain}`,
  `advanced.defaultCookieAttributes`.
- `localhost:3000` and `localhost:3001` are the **same site** (ports are ignored
  for same-site), which is why `SameSite=Lax` works in dev today.
