import { findAllBookings, findBookingsByUserId } from "../db/bookings.js";
import { Page } from "../classes/page/page.js";
import { findAllCourts } from "../db/courts.js";
import { getAllMemberships, getAllRoles, getAllUsers } from "../db/users.js";
export const queryResolvers = {
    Query: {
        bookings: async (parent, args) => {
            if (args.userId) {
                return await findBookingsByUserId(args.userId);
            }
            return await findAllBookings();
        },
        user: async (parent, args, context) => {
            return await context.userLoader.load(args.id);
        },
        users: async (parent, args, context) => {
            return await getAllUsers();
        },
        page: async (parent, args, context) => {
            return new Page(args.id);
        },
        courts: async (parent, args, context) => {
            return await findAllCourts();
        },
        roles: async (parent, args, context) => {
            return await getAllRoles();
        },
        memberships: async (parent, args, context) => {
            return await getAllMemberships();
        },
        userOrderHistory: async (parent, args, context) => {
            return await context.orderLoader.load({
                userEmail: args.userEmail,
                userId: args.userId,
                limit: args.limit || 20,
            });
        },
    },
};
