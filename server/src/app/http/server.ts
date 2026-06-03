import { Elysia, type Context } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "../../env";
import { auth } from "@infra/auth";

const betterAuthView = (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  }
  return new Response(null, { status: 405 });
};

export const app = new Elysia()
  // Allow the browser client (different origin) to send credentialed requests.
  .use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .all("/api/auth/*", betterAuthView)
  .get("/", () => ({ message: "Server running" }))
  .get("/health", () => ({ status: "ok" }))
  .listen(env.PORT);

console.log(`Server running on http://localhost:${app.server?.port}`);
