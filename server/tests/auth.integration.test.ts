import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Elysia, type Context } from "elysia";
import { createAuthClient } from "better-auth/client";
import { auth } from "@infra/auth";
import { db } from "@infra/db";
import { user } from "@infra/db/schema";
import { eq } from "drizzle-orm";

/**
 * End-to-end validation of the Better Auth setup.
 *
 * Spins up the real Better Auth handler on an ephemeral port, then drives the
 * full email/password flow (sign-up -> sign-in -> get-session -> sign-out)
 * through the actual Better Auth client SDK — the same SDK the TanStack Start
 * front-end uses. Runs against the real Postgres database.
 *
 * Requires Postgres running (docker compose up -d) and migrations applied
 * (bun run db:migrate).
 */

// A unique account per run so repeated runs never collide.
const testEmail = `e2e-${Date.now()}@example.com`;
const testPassword = "YOUR_PASSWORD_HERE";
const testName = "E2E Tester";

// --- Cookie jar so the server-side fetch behaves like a browser session ---
const jar = new Map<string, string>();

const fetchWithCookies: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  if (jar.size > 0) {
    headers.set(
      "cookie",
      [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
    );
  }
  const res = await fetch(input, { ...init, headers });
  for (const sc of res.headers.getSetCookie?.() ?? []) {
    const pair = sc.split(";")[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
  return res;
};

let server: ReturnType<Elysia["listen"]>;
let baseURL: string;
let client: ReturnType<typeof createAuthClient>;

beforeAll(() => {
  const handler = (context: Context) => auth.handler(context.request);
  server = new Elysia().all("/api/auth/*", handler).listen(0);
  baseURL = `http://localhost:${server.server?.port}`;
  client = createAuthClient({
    baseURL,
    fetchOptions: { customFetchImpl: fetchWithCookies },
  });
});

afterAll(async () => {
  // Clean up the test account and stop the server.
  await db.delete(user).where(eq(user.email, testEmail));
  server.stop();
});

describe("Better Auth email/password flow", () => {
  test("sign-up creates a user", async () => {
    const { data, error } = await client.signUp.email({
      name: testName,
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(data?.user.email).toBe(testEmail);
    expect(data?.user.name).toBe(testName);
  });

  test("sign-in returns a valid session", async () => {
    const { data, error } = await client.signIn.email({
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(data?.user.email).toBe(testEmail);
    expect(data?.token).toBeTruthy();
  });

  test("get-session returns the authenticated user", async () => {
    const { data, error } = await client.getSession();

    expect(error).toBeNull();
    expect(data?.user.email).toBe(testEmail);
    expect(data?.session.token).toBeTruthy();
  });

  test("wrong password is rejected", async () => {
    // Use a fresh jar so the active session does not leak in.
    const guest = createAuthClient({ baseURL });
    const { data, error } = await guest.signIn.email({
      email: testEmail,
      password: "wrong-password",
    });

    expect(data).toBeNull();
    expect(error?.status).toBe(401);
  });

  test("sign-out ends the session", async () => {
    const { error } = await client.signOut();
    expect(error).toBeNull();

    const { data } = await client.getSession();
    expect(data).toBeNull();
  });
});
