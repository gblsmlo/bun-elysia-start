import type { account } from "@infra/db/schema";

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
