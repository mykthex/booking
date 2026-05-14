import { bookingTypes } from "./booking.js";
import { courtTypes } from "./courts.js";
import { membershipTypes } from "./membership.js";
import { mutationTypes } from "./mutation.js";
import { orderTypes } from "./order.js";
import { pageTypes } from "./page.js";
import { queryTypes } from "./query.js";
import { roleTypes } from "./role.js";
import { userTypes } from "./user.js";
export const typeDefs = [
    userTypes,
    bookingTypes,
    queryTypes,
    pageTypes,
    courtTypes,
    mutationTypes,
    orderTypes,
    roleTypes,
    membershipTypes,
];
