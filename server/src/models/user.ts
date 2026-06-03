import type { user } from "@infra/db/schema";

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
