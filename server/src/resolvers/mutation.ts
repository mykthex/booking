import type { IResolvers } from "@graphql-tools/utils";
import { createBooking } from "../db/bookings.js";
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
      };

      const { user } = context;

      if (!user) {
        throw new Error("Unauthorized");
      }

      const createdBooking = await createBooking(newBooking);

      return [createdBooking];
    },
  },
};
