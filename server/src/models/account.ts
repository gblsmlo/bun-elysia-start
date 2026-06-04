import type { accounts } from "@infra/db/schema";

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
