import { createAuthClient } from "better-auth/react";

/**
 * Better Auth browser client.
 *
 * Points at the standalone Elysia auth server. `credentials: "include"` is the
 * default for this client, so the session cookie is sent on every request.
 * The server must list this origin in `trustedOrigins` and allow credentialed
 * CORS (see ../../server).
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
