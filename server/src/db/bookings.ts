import DataLoader from "dataloader";
import { db } from "./database.js";
import { Booking } from "./types.js";

export async function findAllBookings(): Promise<Booking[]> {
  return await db.selectFrom("bookings").selectAll().execute();
}

export async function findBookingsByUserId(userId: string): Promise<Booking[]> {
  return await db
    .selectFrom("bookings")
    .selectAll()
    .where("userId", "=", userId)
    .execute();
}

export async function createBooking(
  booking: Omit<Booking, "id">,
): Promise<Booking> {
  const [newBooking] = await db
    .insertInto("bookings")
    .values(booking)
    .returningAll()
    .execute();

  return newBooking;
}

export async function updateBooking(
  userId: string,
  date: string,
  hour: number,
  updates: Partial<Omit<Booking, "userId" | "date" | "hour">>,
): Promise<Booking | null> {
  const [updatedBooking] = await db
    .updateTable("bookings")
    .set(updates)
    .where("userId", "=", userId)
    .where("date", "=", date)
    .where("hour", "=", hour)
    .returningAll()
    .execute();

  return updatedBooking || null;
}

export async function deleteBooking(bookingId: string): Promise<void> {
  await db.deleteFrom("bookings").where("id", "=", bookingId).execute();
}

export function createBookingLoader() {
  return new DataLoader(async (ids: string[]) => {
    const bookings = await findAllBookings();
    return ids.map((id) => bookings.find((booking) => booking.userId === id));
  });
}
