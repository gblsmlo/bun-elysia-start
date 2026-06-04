import type { members } from "@infra/db/schema";

export type OrganizationRole = "owner" | "member";
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
