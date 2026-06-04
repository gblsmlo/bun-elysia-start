import { db } from "@infra/db";
import * as schema from "@infra/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, organization } from "better-auth/plugins";
import { env } from "./env";

export const auth = betterAuth({
  basePath: "/auth",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CLIENT_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema },
    usePlural: true,
  }),
  advanced: {
    database: {
      generateId: false,
    },
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password: string) => Bun.password.hash(password),
      verify: ({ password, hash }) => Bun.password.verify(password, hash),
      salt: env.BETTER_AUTH_PASSWORD_HASH_SALT,
    },
  },
  session: {
    expiresIn: env.BETTER_AUTH_SESSION_EXPIRES_IN ?? 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: env.BETTER_AUTH_COOKIE_CACHE ?? 60 * 5,
    },
  },
  plugins: [
    openAPI(),
    organization({
      creatorRole: "owner",
    }),
  ],
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());
export const OpenAPI = {
  getPaths: (prefix = "/auth") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);
      for (const path of Object.keys(paths)) {
        const pathItem = paths[path];
        if (!pathItem) continue;
        const key = prefix + path;
        reference[key] = pathItem;
        for (const method of Object.keys(pathItem)) {
          const operation = (reference[key] as any)[method];
          operation.tags = ["Auth"];
        }
      }
      return reference;
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;

export type Session = typeof auth.$Infer.Session;
