import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { invitation } from "./invitation";
import { member } from "./member";
import { session } from "./session";

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logo: text("logo"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("organization_slug_idx").on(table.slug)],
);

export const organizationRelations = relations(organization, ({ many }) => ({
  invitations: many(invitation),
  members: many(member),
  activeSessions: many(session),
}));
