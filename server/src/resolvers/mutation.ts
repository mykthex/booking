import type { IResolvers } from "@graphql-tools/utils";
import { createBooking, deleteBooking, updateBooking } from "../db/bookings.js";
import { ResolverContext } from "../resolvers.js";
import { createCourt, updateCourt } from "../db/courts.js";
import { randomUUID } from "crypto";

export const mutationResolvers: IResolvers = {
  Mutation: {
    createBooking: async (
      parent: unknown,
      args: {
        userId: string;
        player2Id?: string;
        courtId: string;
        date: string;
        hour: number;
        paid: boolean;
      },
      context: ResolverContext,
    ): Promise<any> => {
      const newBooking = {
        id: randomUUID(), // Generate a unique UUID
        userId: args.userId,
        player1: args.userId || null,
        player2: args.player2Id || null,
        courtId: args.courtId,
        date: args.date,
        hour: args.hour,
        paid: args.paid ? 1 : 0, // Convert boolean to number for DB
      };
      const createdBooking = await createBooking(newBooking);

      return createdBooking || null; // Return the created booking or null if creation failed
    },
    updateBooking: async (
      parent: unknown,
      args: {
        id: string;
        player1Id?: string;
        player2Id?: string;
        courtId?: number;
        date?: string;
        hour?: number;
        paid?: boolean;
      },
      context: ResolverContext,
    ): Promise<any> => {
      const updates: any = {};
      if (args.player1Id) updates.player1 = args.player1Id;
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
    createCourt: async (
      parent: unknown,
      args: { name: string; number: string; type: string; active: boolean },
      context: ResolverContext,
    ): Promise<any> => {
      const newCourt = {
        id: randomUUID(), // Generate a unique UUID
        name: args.name,
        number: args.number,
        type: args.type,
        active: args.active ? 1 : 0, // Convert boolean to number for DB
      };
      const createdCourt = await createCourt(newCourt);
      return createdCourt || null; // Return the created court or null if creation failed
    },
    updateCourt: async (
      parent: unknown,
      args: { id: string; name?: string; number?: string; type?: string; active?: boolean },
      context: ResolverContext,
    ): Promise<any> => {
      const updates: any = {};
      if (args.name) updates.name = args.name;
      if (args.number) updates.number = args.number;
      if (args.type) updates.type = args.type;
      if (typeof args.active === "boolean") updates.active = args.active ? 1 : 0;

      const updatedCourt = await updateCourt(parseInt(args.id), updates);
      return updatedCourt || null;
    },
  },
};
