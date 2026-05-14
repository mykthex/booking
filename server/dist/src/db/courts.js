import DataLoader from "dataloader";
import { db } from "./database.js";
export async function getCourtById(id) {
    return await db
        .selectFrom("courts")
        .where("id", "=", id)
        .selectAll()
        .executeTakeFirst();
}
export async function createCourt(court) {
    const [newCourt] = await db
        .insertInto("courts")
        .values(court)
        .returningAll()
        .execute();
    return newCourt;
}
export async function updateCourt(courtId, updates) {
    const [updatedCourt] = await db
        .updateTable("courts")
        .set(updates)
        .where("id", "=", courtId)
        .returningAll()
        .execute();
    return updatedCourt || null;
}
export async function findAllCourts() {
    return await db.selectFrom("courts").selectAll().execute();
}
export async function getCourtsByIds(ids) {
    return await db
        .selectFrom("courts")
        .where("id", "in", ids)
        .selectAll()
        .execute();
}
export function createCourtLoader() {
    return new DataLoader(async (ids) => {
        const courts = await getCourtsByIds([...ids]);
        const courtMap = new Map(courts.map((court) => [court.id, court]));
        return ids.map((id) => courtMap.get(id) || null);
    });
}
