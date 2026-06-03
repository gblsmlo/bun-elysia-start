import type { member } from "@infra/db/schema";

export type OrganizationRole = "owner" | "member";
export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;
