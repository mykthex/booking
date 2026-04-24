import type { IResolvers } from "@graphql-tools/utils";
import { findAllBookings, findBookingsByUserId } from "../db/bookings.js";
import type { Booking } from "../db/types.js";
import { PageName } from "../classes/page/types.js";
import { Page } from "../classes/page/page.js";
import { findAllCourts } from "../db/courts.js";
import { getAllMemberships, getAllRoles, getAllUsers } from "../db/users.js";

export const queryResolvers: IResolvers = {
  Query: {
    bookings: async (
      parent: unknown,
      args: { userId?: string },
    ): Promise<Booking[]> => {
      if (args.userId) {
        return await findBookingsByUserId(args.userId);
      }

      return await findAllBookings();
    },
    user: async (parent: unknown, args: { id: string }, context: any) => {
      return await context.userLoader.load(args.id);
    },
    users: async (parent: unknown, args: any, context: any) => {
      return await getAllUsers();
    },
    page: async (parent: unknown, args: { id: PageName }, context: any) => {
      return new Page(args.id);
    },
    courts: async (parent: unknown, args: any, context: any) => {
      return await findAllCourts();
    },
    roles: async (parent: unknown, args: any, context: any) => {
      return await getAllRoles();
    },
    memberships: async (parent: unknown, args: any, context: any) => {
      return await getAllMemberships();
    },
    userOrderHistory: async (
      parent: unknown,
      args: { userEmail?: string; userId?: string; limit?: number },
      context: any
    ) => {
      return await context.orderLoader.load({
        userEmail: args.userEmail,
        userId: args.userId,
        limit: args.limit || 20,
      });
    },
  },
};
