import type { organization } from "@infra/db/schema";

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
