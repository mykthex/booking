import DataLoader from "dataloader";
import { GraphQLError } from "graphql";
import { Booking, User, Court } from "./db/types.js";

interface OrderInput {
  userEmail?: string;
  userId?: string;
  limit?: number;
}

interface Order {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  created: string;
  description?: string;
  subscriptionType?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface ResolverContext {
  bookingLoader: DataLoader<string, Booking, string>;
  userLoader: DataLoader<string, User | null, string>;
  courtLoader: DataLoader<number, Court | null, number>;
  orderLoader: DataLoader<OrderInput, Order[], OrderInput>;
  user: User | null;
}

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
