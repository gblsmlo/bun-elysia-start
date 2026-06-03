import { Elysia, type Context } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@infra/auth";

const betterAuthView = (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  }
  context.error(405);
};

const port = process.env.PORT || 3000;
const clientURL = process.env.CLIENT_URL ?? "http://localhost:3001";

export const app = new Elysia()
  // Allow the browser client (different origin) to send credentialed requests.
  .use(
    cors({
      origin: clientURL,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .all("/api/auth/*", betterAuthView)
  .get("/", () => ({ message: "Server running" }))
  .get("/health", () => ({ status: "ok" }))
  .listen(port);

console.log(`Server running on http://localhost:${app.server?.port}`);
