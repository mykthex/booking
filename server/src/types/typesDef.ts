import { bookingTypes } from "./booking";
import { courtTypes } from "./courts";
import { mutationTypes } from "./mutation";
import { pageTypes } from "./page";
import { queryTypes } from "./query";

export const typeDefs = [
  bookingTypes,
  queryTypes,
  pageTypes,
  courtTypes,
  mutationTypes,
];
