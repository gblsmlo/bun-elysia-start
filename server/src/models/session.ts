import type { sessions } from "@infra/db/schema";

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
