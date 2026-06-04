import { getUserById } from "@app/functions/get-user-by-id";
import { openapi } from "@elysia/openapi";
import { cors } from "@elysiajs/cors";
import { OpenAPI } from "@infra/auth";
import { env } from "@infra/env";
import { betterAuthPlugin } from "@infra/http/plugins/better-auth";
import { Elysia } from "elysia";
import zod from "zod";

export const app = new Elysia()
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(
    cors({
      origin: env.CLIENT_URL,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(betterAuthPlugin)
  .get("/", () => ({ message: "Server running" }))
  .get(
    "/user/:id",
    async ({ params, user }) => {
      const authenticatedUser = user.name;
      console.log(authenticatedUser);

      const { id: userId } = params;

      return getUserById(userId);
    },
    {
      auth: true,
      detail: {
        summary: "Get user by id",
        tags: ["User"],
      },
      params: zod.object({
        id: zod.string(),
      }),
      response: {
        200: zod.object({
          message: zod.string(),
        }),
      },
    },
  )
  .listen(env.PORT);

console.log(`Server running on http://localhost:${app.server?.port}`);
