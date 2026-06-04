import { defineConfig } from "drizzle-kit";
import { env } from "@infra/env";

export default defineConfig({
  out: "./src/infra/db/migrations",
  schema: "./src/infra/db/schema/index.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
