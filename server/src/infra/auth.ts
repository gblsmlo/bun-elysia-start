import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@infra/db";
import * as schema from "@infra/db/schema";

// Origin of the front-end (TanStack Start dev server). Used for CORS / CSRF
// trusted-origin checks so the browser client can send credentialed requests.
const clientURL = process.env.CLIENT_URL ?? "http://localhost:3001";

export const auth = betterAuth({
  // `secret` and `baseURL` are read from BETTER_AUTH_SECRET / BETTER_AUTH_URL
  // automatically, but we set them explicitly for clarity.
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  // The auth client lives on a different origin (port), so it must be trusted.
  trustedOrigins: [clientURL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema },
  }),
  emailAndPassword: {
    enabled: true,
  },
});

export type Session = typeof auth.$Infer.Session;
