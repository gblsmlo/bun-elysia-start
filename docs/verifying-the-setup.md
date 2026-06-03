# Verifying the Better Auth setup

How to confirm the auth setup (server + client) is wired correctly. Follow the
sections in order.

## Prerequisites (run once)

```bash
cd server
docker compose up -d        # start Postgres
bun run db:migrate          # create tables: user, session, account, verification
```

Quick sanity checks:

```bash
# Postgres reachable?
timeout 2 bash -c "</dev/tcp/localhost/5432" && echo "OK: port 5432 open"

# Auth tables present?
bun -e "import postgres from 'postgres'; const sql=postgres(process.env.DATABASE_URL); const r=await sql\`select tablename from pg_tables where schemaname='public' order by tablename\`; console.log(r.map(x=>x.tablename).join(', ')); await sql.end();"
# expected: account, session, user, verification
```

## 1. Automated integration test (primary check)

This is the main artifact. It boots the real Better Auth handler on an
ephemeral port and drives the full flow through the actual client SDK against
the real Postgres database.

```bash
cd server
bun test tests/auth.integration.test.ts
```

Expected: `5 pass, 0 fail`. It covers:

- `sign-up` creates a user
- `sign-in` returns a valid session
- `get-session` returns the authenticated user
- wrong password is rejected with 401
- `sign-out` ends the session

Note: a log line `ERROR [Better Auth]: Invalid password` is expected — it is the
wrong-password test asserting the 401.

## 2. Client build and typecheck

Confirms the TanStack Start app compiles and the Better Auth client is wired
into all routes.

```bash
cd client
bun run build       # compiles all routes (login/signup/dashboard) + SSR
bunx tsc --noEmit   # typecheck, should exit clean
```

## 3. Manual browser smoke test (optional, real end-to-end)

```bash
# terminal 1
cd server && bun run dev    # http://localhost:3000

# terminal 2
cd client && bun run dev    # http://localhost:3001
```

Then in the browser:

1. Open `http://localhost:3001`.
2. Sign up -> should redirect to `/dashboard` showing your email.
3. Sign out -> returns to `/login`.
4. DevTools > Application > Cookies: confirm `better-auth.session_token` is set.

## 4. API smoke test via curl (CORS + cookie)

```bash
curl -i -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3001" \
  -d '{"name":"Test","email":"t@example.com","password":"YOUR_PASSWORD_HERE"}'
```

Expected in the response:

- `HTTP/1.1 200 OK`
- `set-cookie: better-auth.session_token=...`
- `access-control-allow-origin: http://localhost:3001`

## Troubleshooting

- **Test fails to connect / tables missing:** Postgres not up or migrations not
  applied. Re-run the Prerequisites section.
- **`drizzle-kit` errors on PORT:** `server/src/env.ts` must coerce `PORT`
  (`z.coerce.number()`), since env vars are strings.
- **Browser request blocked by CORS:** the request Origin must be in the
  server's `trustedOrigins` and `CLIENT_URL` (see `server/.env`).
- **Cookie not stored in browser:** dev only works because `localhost:3000` and
  `localhost:3001` are the same site (`SameSite=Lax`). Production needs the
  environment-based config tracked in `.issues/env-based-auth-config.md`
  (GitHub issue #1).
