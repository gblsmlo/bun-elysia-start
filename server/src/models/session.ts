import type { session } from "@infra/db/schema";

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
