import type { verification } from "@infra/db/schema";

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
