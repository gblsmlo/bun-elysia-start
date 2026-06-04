import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
  PORT: z.coerce.number().default(3000),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  BETTER_AUTH_PASSWORD_HASH_SALT: z.coerce.number().min(6).optional(),
  BETTER_AUTH_SESSION_EXPIRES_IN: z.coerce.number().default(604800),
  BETTER_AUTH_COOKIE_CACHE: z.coerce.number().default(300),
  CLIENT_URL: z.url().default("http://localhost:3001"),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(Bun.env);
