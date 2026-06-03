import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { authBaseURL } from "./env";

/**
 * Better Auth browser client.
 *
 * Points at the standalone Elysia auth server. `credentials: "include"` is the
 * default for this client, so the session cookie is sent on every request.
 * The server must list this origin in `trustedOrigins` and allow credentialed
 * CORS (see ../../server).
 */
export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
