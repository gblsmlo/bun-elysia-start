import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  // Env vars are always strings; coerce to a number.
  PORT: z.coerce.number().default(3000),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  CLIENT_URL: z.url().default("http://localhost:3001"),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
