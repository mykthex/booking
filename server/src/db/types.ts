import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  user: UserTable;
  courts: CourtsTable;
  bookings: BookingsTable;
  memberships: MembershipTable;
  role: RoleTable;
}

export interface UserTable {
  id: Generated<string>;
  email: string;
  role: number;
  membershipId: number;
  password: string;
  name: string;
}
export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export interface BookingsTable {
  id: Generated<string>;
  userId: string;
  date: string;
  hour: number;
  /* player1 refers to User.id */
  player1: string;
  /* player2 refers to User.id */
  player2: string;
  courtId: number;
  paid: number;
}

export type Booking = Selectable<BookingsTable>;
export type NewBooking = Insertable<BookingsTable>;
export type BookingUpdate = Updateable<BookingsTable>;

export interface CourtsTable {
  id: Generated<number>;
  name: string;
  number: string;
}

export type Court = Selectable<CourtsTable>;
export type NewCourt = Insertable<CourtsTable>;
export type CourtUpdate = Updateable<CourtsTable>;

export interface MembershipTable {
  id: Generated<number>;
  name: string;
}

export type Membership = Selectable<MembershipTable>;
export type NewMembership = Insertable<MembershipTable>;
export type MembershipUpdate = Updateable<MembershipTable>;

export interface RoleTable {
  id: Generated<number>;
  role: string;
}

export type Role = Selectable<RoleTable>;
export type NewRole = Insertable<RoleTable>;
export type RoleUpdate = Updateable<RoleTable>;
