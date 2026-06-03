import { z } from "zod";

const clientEnvSchema = z.object({
  VITE_SERVER_URL: z.url().or(z.literal("")).default("http://localhost:3000"),
});

export const clientEnv = clientEnvSchema.parse({
  VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
});

export const authBaseURL = clientEnv.VITE_SERVER_URL || undefined;
