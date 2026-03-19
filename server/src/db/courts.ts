import DataLoader from "dataloader";
import { db } from "./database.js";
import { Court } from "./types.js";

export async function getCourtById(id: number) {
  return await db
    .selectFrom("courts")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export async function findAllCourts(): Promise<Court[]> {
  return await db.selectFrom("courts").selectAll().execute();
}

export async function getCourtsByIds(ids: number[]): Promise<Court[]> {
  return await db
    .selectFrom("courts")
    .where("id", "in", ids)
    .selectAll()
    .execute();
}

export function createCourtLoader() {
  return new DataLoader(async (ids: readonly number[]) => {
    const courts = await getCourtsByIds([...ids]);
    const courtMap = new Map(courts.map((court) => [court.id, court]));
    return ids.map((id) => courtMap.get(id) || null);
  });
}
