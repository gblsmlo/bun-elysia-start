import { db } from ".";
import { members, organizations, users } from "./schema";

async function seed() {
  const [createdUser] = await db
    .insert(users)
    .values({
      name: "Admin",
      email: "admin@example.com",
      emailVerified: true,
    })
    .returning();

  if (!createdUser) {
    throw new Error("Failed to seed user");
  }

  const [createdOrganization] = await db
    .insert(organizations)
    .values({
      name: "Admin Organization",
      slug: "admin-organization",
    })
    .returning();

  if (!createdOrganization) {
    throw new Error("Failed to seed organization");
  }

  await db.insert(members).values({
    organizationId: createdOrganization.id,
    userId: createdUser.id,
    role: "owner",
  });

  console.log("Seed completed");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
