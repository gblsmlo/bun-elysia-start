import { Elysia, type Context } from "elysia";
import { auth } from "@infra/auth";

const betterAuthView = (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  }
  context.error(405);
};

const port = process.env.PORT || 3000;

export const app = new Elysia()
  .all("/api/auth/*", betterAuthView)
  .get("/", () => ({ message: "Server running" }))
  .get("/health", () => ({ status: "ok" }))
  .listen(port);

console.log(`Server running on http://localhost:${app.server?.port}`);
