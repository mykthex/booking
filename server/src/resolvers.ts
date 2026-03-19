import DataLoader from "dataloader";
import { GraphQLError } from "graphql";
import { Booking, User, Court } from "./db/types.js";
import { findAllBookings, findBookingsByUserId } from "./db/bookings.js";

export interface ResolverContext {
  bookingLoader: DataLoader<string, Booking, string>;
  userLoader: DataLoader<string, User | null, string>;
  courtLoader: DataLoader<number, Court | null, number>;
}

export const resolvers = {
  Query: {
    bookings: async (parent: any, args: { userId?: string }) => {
      if (args.userId) {
        return await findBookingsByUserId(args.userId);
      }

      return await findAllBookings();
    },
  },
};

function notFoundError(message: string) {
  return new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });
}

function unauthorizedError(message: string) {
  return new GraphQLError(message, {
    extensions: { code: "UNAUTHORIZED" },
  });
}

function toIsoDate(value: string) {
  return value.slice(0, "yyyy-mm-dd".length);
}
