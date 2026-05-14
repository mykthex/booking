import DataLoader from "dataloader";
import { db } from "./database.js";
export async function findAllBookings() {
    return await db.selectFrom("bookings").selectAll().execute();
}
export async function findBookingsByUserId(userId) {
    return await db
        .selectFrom("bookings")
        .selectAll()
        .where((eb) => eb.or([
        eb('userId', '=', userId),
        eb('player1', '=', userId),
        eb('player2', '=', userId),
    ]))
        .execute();
}
export async function createBooking(booking) {
    const [newBooking] = await db
        .insertInto("bookings")
        .values(booking)
        .returningAll()
        .execute();
    return newBooking;
}
export async function updateBooking(bookingId, updates) {
    const [updatedBooking] = await db
        .updateTable("bookings")
        .set(updates)
        .where("id", "=", bookingId)
        .returningAll()
        .execute();
    return updatedBooking || null;
}
export async function deleteBooking(bookingId) {
    await db.deleteFrom("bookings").where("id", "=", bookingId).execute();
}
export function createBookingLoader() {
    return new DataLoader(async (ids) => {
        const bookings = await findAllBookings();
        return ids.map((id) => bookings.find((booking) => booking.userId === id));
    });
}
