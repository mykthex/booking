import DataLoader from "dataloader";
import { db } from "./database.js";
import { User } from "./types.js";

export async function getUserByEmail(email: string) {
  return await db
    .selectFrom("user")
    .where("email", "=", email)
    .selectAll()
    .executeTakeFirst();
}

export async function getUserById(id: string) {
  return await db
    .selectFrom("user")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export async function getUsersByIds(ids: string[]): Promise<User[]> {
  return await db
    .selectFrom("user")
    .where("id", "in", ids)
    .selectAll()
    .execute();
}

export async function getAllUsers(): Promise<User[]> {
  return await db.selectFrom("user").selectAll().execute();
}

export function createUserLoader() {
  return new DataLoader(async (ids: readonly string[]) => {
    const users = await getUsersByIds([...ids]);
    const userMap = new Map(users.map((user) => [user.id, user]));
    return ids.map((id) => userMap.get(id) || null);
  });
}
