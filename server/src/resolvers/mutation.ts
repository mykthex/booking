import type { IResolvers } from "@graphql-tools/utils";
import { createBooking, deleteBooking, updateBooking } from "../db/bookings.js";
import { ResolverContext } from "../resolvers.js";

export const mutationResolvers: IResolvers = {
  Mutation: {
    createBooking: async (
      parent: unknown,
      args: {
        userId: string;
        player2Id?: string;
        courtId: number;
        date: string;
        hour: number;
        paid: boolean;
      },
      context: ResolverContext,
    ): Promise<any[]> => {
      const newBooking = {
        id: Math.random().toString(36).substr(2, 9), // Generate a random ID
        userId: args.userId,
        player1: args.userId || null,
        player2: args.player2Id || null,
        courtId: args.courtId,
        date: args.date,
        hour: args.hour,
        paid: args.paid ? 1 : 0, // Convert boolean to number for DB
      };
      const createdBooking = await createBooking(newBooking);

      return [createdBooking];
    },
    updateBooking: async (
      parent: unknown,
      args: {
        id: string;
        userId?: string;
        player2Id?: string;
        courtId?: number;
        date?: string;
        hour?: number;
        paid?: boolean;
      },
      context: ResolverContext,
    ): Promise<any> => {
      const updates: any = {};
      if (args.userId) updates.userId = args.userId;
      if (args.player2Id) updates.player2 = args.player2Id;
      if (args.courtId) updates.courtId = args.courtId;
      if (args.date) updates.date = args.date;
      if (args.hour) updates.hour = args.hour;
      if (typeof args.paid === "boolean") updates.paid = args.paid ? 1 : 0;

      const updatedBooking = await updateBooking(args.id, updates);
      return updatedBooking || null;
    },
    deleteBooking: async (
      parent: unknown,
      args: { id: string },
      context: ResolverContext,
    ): Promise<boolean> => {
      try {
        await deleteBooking(args.id); // Delete the booking from the database
        return true;
      } catch (error) {
        console.error("Error deleting booking:", error);
        return false;
      }
    },
  },
};
