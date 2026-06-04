import type { users } from "@infra/db/schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
