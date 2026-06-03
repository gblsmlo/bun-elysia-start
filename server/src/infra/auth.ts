import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { env } from "../env";
import { db } from "@infra/db";
import * as schema from "@infra/db/schema";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  // The auth client lives on a different origin (port), so it must be trusted.
  trustedOrigins: [env.CLIENT_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      creatorRole: "owner",
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
