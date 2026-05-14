import { db } from "../db/database.js";
export const userResolvers = {
    User: {
        role: async (parent) => {
            return parent.role;
        },
        membershipId: async (parent) => {
            return parent.membershipId;
        },
        membership: async (parent) => {
            // Query membership name from database
            try {
                const membership = await db
                    .selectFrom("memberships")
                    .select("name")
                    .where("id", "=", parent.membershipId)
                    .executeTakeFirst();
                return membership?.name || "none";
            }
            catch (error) {
                console.error("Error fetching membership:", error);
                return "none";
            }
        },
    },
};
