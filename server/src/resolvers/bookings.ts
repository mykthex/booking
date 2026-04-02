import type { IResolvers } from "@graphql-tools/utils";
import type { Booking } from "../db/types";

interface BookingContext {
  userLoader: any;
  courtLoader: any;
}

export const bookingResolvers: IResolvers = {
  Booking: {
    player1: async (parent: Booking, _args: any, context: BookingContext) => {
      if (!parent.player1) return null;
      const user = await context.userLoader.load(parent.player1);
      return user?.name || null;
    },
    player2: async (parent: Booking, _args: any, context: BookingContext) => {
      if (!parent.player2) return null;
      const user = await context.userLoader.load(parent.player2);
      return user?.name || null;
    },
    courtName: async (parent: Booking, _args: any, context: BookingContext) => {
      if (!parent.courtId) return null;
      const court = await context.courtLoader.load(parent.courtId);
      return court?.name || null;
    },
    paid: async (parent: Booking) => {
      return Boolean(parent.paid || false);
    },
  },
};
