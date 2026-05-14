import { bookingResolvers } from "./bookings.js";
import { mutationResolvers } from "./mutation.js";
import { pageResolvers } from "./page.js";
import { queryResolvers } from "./query.js";
import type { IResolvers } from "@graphql-tools/utils";
import { userResolvers } from "./user.js";
import { roleResolvers } from "./role.js";
import { membershipResolvers } from "./membership.js";
import { orderResolvers } from "./order.js";

export const typesResolvers: IResolvers[] = [
  userResolvers,
  bookingResolvers,
  queryResolvers,
  pageResolvers,
  mutationResolvers,
  roleResolvers,
  membershipResolvers,
  orderResolvers,
];
