import { db } from ".";
import { accounts, user } from "./schema";

async function seed() {
  const [createdUser] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Admin",
      email: "admin@example.com",
      emailVerified: true,
    })
    .returning();

  if (!createdUser) {
    throw new Error("Failed to seed user");
  }

  await db.insert(accounts).values({
    displayName: "Admin Account",
    userId: createdUser.id,
  });

  console.log("Seed completed");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
