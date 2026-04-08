import { bookingTypes } from "./booking";
import { courtTypes } from "./courts";
import { membershipTypes } from "./membership";
import { mutationTypes } from "./mutation";
import { pageTypes } from "./page";
import { queryTypes } from "./query";
import { roleTypes } from "./role";
import { userTypes } from "./user";

export const typeDefs = [
  userTypes,
  bookingTypes,
  queryTypes,
  pageTypes,
  courtTypes,
  mutationTypes,
  roleTypes,
  membershipTypes,
];
