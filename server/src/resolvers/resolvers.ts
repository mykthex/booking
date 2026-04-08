import { bookingResolvers } from "./bookings";
import { mutationResolvers } from "./mutation";
import { pageResolvers } from "./page";
import { queryResolvers } from "./query";
import type { IResolvers } from "@graphql-tools/utils";
import { userResolvers } from "./user";
import { roleResolvers } from "./role";
import { membershipResolvers } from "./membership";

export const typesResolvers: IResolvers[] = [
  userResolvers,
  bookingResolvers,
  queryResolvers,
  pageResolvers,
  mutationResolvers,
  roleResolvers,
  membershipResolvers,
];
